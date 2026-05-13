import { describe, expect, it } from "vitest";
import { parseGpuMetrics } from "@/lib/ssh/commands";

describe("parseGpuMetrics", () => {
  it("parses nvidia-smi csv output", () => {
    const result = parseGpuMetrics(
      "NVIDIA,0, NVIDIA RTX A4000, 42, 4096, 16384, 61, 83.5\n"
    );

    expect(result).toEqual([
      {
        id: "0",
        name: "NVIDIA RTX A4000",
        vendor: "nvidia",
        utilization: 42,
        memoryUsed: 4096 * 1024 * 1024,
        memoryTotal: 16384 * 1024 * 1024,
        memoryPercent: 25,
        temperature: 61,
        powerDraw: 83.5,
      },
    ]);
  });

  it("parses legacy nvidia-smi csv output without a source prefix", () => {
    const result = parseGpuMetrics("0, NVIDIA RTX A4000, 42, 4096, 16384, 61, 83.5\n");

    expect(result[0].vendor).toBe("nvidia");
    expect(result[0].utilization).toBe(42);
  });

  it("parses intel_gpu_top json output", () => {
    const result = parseGpuMetrics(`INTEL_GPU_TOP_BEGIN
{
  "frequency": { "requested": 300.0, "actual": 450.0, "unit": "MHz" },
  "power": { "GPU": 4.25, "unit": "W" },
  "engines": {
    "Render/3D/0": { "busy": 12.5, "unit": "%" },
    "Video/0": { "busy": 8.0, "unit": "%" }
  }
}
INTEL_GPU_TOP_END`);

    expect(result).toEqual([
      {
        id: "intel",
        name: "Intel iGPU",
        vendor: "intel",
        utilization: 20.5,
        memoryUsed: 0,
        memoryTotal: 0,
        memoryPercent: 0,
        powerDraw: 4.25,
        frequencyMHz: 450,
      },
    ]);
  });

  it("parses intel_gpu_top output when timeout joins the end marker", () => {
    const result = parseGpuMetrics(`INTEL_GPU_TOP_BEGIN
[
{ "frequency": { "actual": 1117.0 }, "power": { "GPU": 0.0 }, "engines": { "Render/3D": { "busy": 0.5 } } }INTEL_GPU_TOP_END
INTEL_SYSFS,card0,0x5912,1117`);

    expect(result).toHaveLength(1);
    expect(result[0].vendor).toBe("intel");
    expect(result[0].id).toBe("card0");
    expect(result[0].utilization).toBe(0.5);
    expect(result[0].frequencyMHz).toBe(1117);
  });

  it("detects an intel igpu through sysfs output", () => {
    const result = parseGpuMetrics("INTEL_SYSFS,card1,0x46a6,650\n");

    expect(result).toEqual([
      {
        id: "card1",
        name: "Intel iGPU 0x46a6",
        vendor: "intel",
        utilization: 0,
        memoryUsed: 0,
        memoryTotal: 0,
        memoryPercent: 0,
        frequencyMHz: 650,
      },
    ]);
  });

  it("returns an empty list when no gpu output is available", () => {
    expect(parseGpuMetrics("")).toEqual([]);
  });
});
