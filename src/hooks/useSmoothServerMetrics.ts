"use client";

import { useEffect, useRef, useState } from "react";
import type {
  DiskMetrics,
  GpuMetrics,
  NetworkMetrics,
  RamMetrics,
  ServerMetrics,
  TimestampedMetrics,
} from "@/types/server";

const SMOOTH_DURATION = 900;
const FRAME_INTERVAL = 33;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function easeOutCubic(value: number): number {
  const inverted = 1 - value;
  return 1 - inverted * inverted * inverted;
}

function lerp(from: number, to: number, progress: number): number {
  return from + (to - from) * progress;
}

function lerpOptional(
  from: number | undefined,
  to: number | undefined,
  progress: number
): number | undefined {
  if (to === undefined) return undefined;
  return lerp(from ?? to, to, progress);
}

function lerpRam(from: RamMetrics, to: RamMetrics, progress: number): RamMetrics {
  return {
    total: to.total,
    used: lerp(from.used, to.used, progress),
    available: lerp(from.available, to.available, progress),
    percent: lerp(from.percent, to.percent, progress),
  };
}

function lerpDisks(
  from: DiskMetrics[],
  to: DiskMetrics[],
  progress: number
): DiskMetrics[] {
  return to.map((target) => {
    const source =
      from.find((disk) => disk.mount === target.mount) ?? target;

    return {
      ...target,
      used: lerp(source.used, target.used, progress),
      available: lerp(source.available, target.available, progress),
      percent: lerp(source.percent, target.percent, progress),
    };
  });
}

function lerpNetwork(
  from: NetworkMetrics[],
  to: NetworkMetrics[],
  progress: number
): NetworkMetrics[] {
  return to.map((target) => {
    const source =
      from.find((network) => network.interface === target.interface) ?? target;

    return {
      ...target,
      rxBytesPerSec: lerp(source.rxBytesPerSec, target.rxBytesPerSec, progress),
      txBytesPerSec: lerp(source.txBytesPerSec, target.txBytesPerSec, progress),
    };
  });
}

function lerpGpus(
  from: GpuMetrics[],
  to: GpuMetrics[],
  progress: number
): GpuMetrics[] {
  return to.map((target) => {
    const source = from.find((gpu) => gpu.id === target.id) ?? target;

    return {
      ...target,
      utilization: lerp(source.utilization, target.utilization, progress),
      memoryUsed: lerp(source.memoryUsed, target.memoryUsed, progress),
      memoryPercent: lerp(source.memoryPercent, target.memoryPercent, progress),
      temperature: lerpOptional(source.temperature, target.temperature, progress),
      powerDraw: lerpOptional(source.powerDraw, target.powerDraw, progress),
      frequencyMHz: lerpOptional(
        source.frequencyMHz,
        target.frequencyMHz,
        progress
      ),
    };
  });
}

function lerpMetrics(
  from: ServerMetrics,
  to: ServerMetrics,
  progress: number
): ServerMetrics {
  return {
    ...to,
    cpu: lerp(from.cpu, to.cpu, progress),
    ram: lerpRam(from.ram, to.ram, progress),
    disk: lerpDisks(from.disk, to.disk, progress),
    network: lerpNetwork(from.network, to.network, progress),
    gpus: lerpGpus(from.gpus, to.gpus, progress),
    uptime: lerp(from.uptime, to.uptime, progress),
    timestamp: Date.now(),
  };
}

export function toTimestampedMetrics(
  metrics: ServerMetrics,
  timestamp = metrics.timestamp
): TimestampedMetrics {
  const primaryNetwork = metrics.network[0];
  const primaryGpu = metrics.gpus[0];

  return {
    cpu: metrics.cpu,
    ramPercent: metrics.ram.percent,
    rxBytesPerSec: primaryNetwork?.rxBytesPerSec ?? 0,
    txBytesPerSec: primaryNetwork?.txBytesPerSec ?? 0,
    gpuPercent: primaryGpu?.utilization,
    gpuMemoryPercent: primaryGpu?.memoryPercent,
    gpuTemperature: primaryGpu?.temperature,
    timestamp,
  };
}

export function useLiveNow(enabled: boolean, interval = FRAME_INTERVAL): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!enabled) {
      setNow(Date.now());
      return;
    }

    let animationFrame = 0;
    let lastFrameAt = 0;

    const tick = (frameNow: number) => {
      if (frameNow - lastFrameAt >= interval) {
        lastFrameAt = frameNow;
        setNow(Date.now());
      }

      animationFrame = requestAnimationFrame(tick);
    };

    animationFrame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrame);
  }, [enabled, interval]);

  return now;
}

export function useSmoothServerMetrics(
  metrics: ServerMetrics | undefined,
  enabled: boolean
): ServerMetrics | undefined {
  const [smoothMetrics, setSmoothMetrics] = useState(metrics);
  const currentRef = useRef<ServerMetrics | undefined>(metrics);
  const transitionRef = useRef<{
    from: ServerMetrics;
    to: ServerMetrics;
    startedAt: number;
  } | null>(null);
  const lastTimestampRef = useRef<number | undefined>(metrics?.timestamp);

  useEffect(() => {
    if (!metrics) {
      setSmoothMetrics(undefined);
      currentRef.current = undefined;
      transitionRef.current = null;
      lastTimestampRef.current = undefined;
      return;
    }

    if (!enabled) {
      setSmoothMetrics(metrics);
      currentRef.current = metrics;
      transitionRef.current = null;
      lastTimestampRef.current = metrics.timestamp;
      return;
    }

    if (lastTimestampRef.current === metrics.timestamp) return;

    transitionRef.current = {
      from: currentRef.current ?? metrics,
      to: metrics,
      startedAt: performance.now(),
    };
    lastTimestampRef.current = metrics.timestamp;
  }, [enabled, metrics]);

  useEffect(() => {
    if (!enabled) return;

    let animationFrame = 0;
    let lastFrameAt = 0;

    const tick = (now: number) => {
      if (now - lastFrameAt >= FRAME_INTERVAL) {
        lastFrameAt = now;
        const transition = transitionRef.current;

        if (transition) {
          const rawProgress = clamp(
            (now - transition.startedAt) / SMOOTH_DURATION,
            0,
            1
          );
          const progress = easeOutCubic(rawProgress);
          const nextMetrics = lerpMetrics(
            transition.from,
            transition.to,
            progress
          );

          currentRef.current = nextMetrics;
          setSmoothMetrics(nextMetrics);

          if (rawProgress >= 1) {
            transitionRef.current = null;
          }
        }
      }

      animationFrame = requestAnimationFrame(tick);
    };

    animationFrame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrame);
  }, [enabled]);

  return enabled ? smoothMetrics : metrics;
}
