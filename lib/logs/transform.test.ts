import { describe, it, expect } from "vitest";
import { transform } from "./transform";
import type { ExportLogsServiceRequest, KeyValue } from "../otlp-types";

// proto types timeUnixNano as number, but values are nanosecond strings at runtime
const ns = (s: string) => s as unknown as number;

const TRACE_ID = new Uint8Array([
  0xde, 0xad, 0xbe, 0xef, 0x00, 0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77, 0x88,
  0x99, 0xaa, 0xbb,
]);
const SPAN_ID = new Uint8Array([
  0xca, 0xfe, 0xba, 0xbe, 0x00, 0x01, 0x02, 0x03,
]);

interface SingleOpts {
  resourceAttrs?: KeyValue[];
  scopeName?: string;
  scopeVersion?: string;
  scopeAttrs?: KeyValue[];
  logAttrs?: KeyValue[];
  timeUnixNano?: number;
  observedTimeUnixNano?: number;
  severityNumber?: number;
  severityText?: string;
  body?: string;
  traceId?: Uint8Array;
  spanId?: Uint8Array;
}

function createMockRecord(opts: SingleOpts = {}): ExportLogsServiceRequest {
  return {
    resourceLogs: [
      {
        resource: {
          attributes: opts.resourceAttrs ?? [],
          droppedAttributesCount: 0,
        },
        scopeLogs: [
          {
            scope: {
              name: opts.scopeName ?? "",
              version: opts.scopeVersion,
              attributes: opts.scopeAttrs ?? [],
              droppedAttributesCount: 0,
            },
            logRecords: [
              {
                timeUnixNano: opts.timeUnixNano ?? 0,
                observedTimeUnixNano: opts.observedTimeUnixNano ?? 0,
                severityNumber: opts.severityNumber ?? 0,
                severityText: opts.severityText ?? "",
                body: { stringValue: opts.body ?? "" },
                attributes: opts.logAttrs ?? [],
                droppedAttributesCount: 0,
                flags: 0,
                traceId: opts.traceId,
                spanId: opts.spanId,
              },
            ],
          },
        ],
      },
    ],
  };
}

describe("transform", () => {
  describe("main case — full result", () => {
    it("maps a complete log record to the full LogRecord shape", () => {
      const result = transform(
        createMockRecord({
          resourceAttrs: [
            { key: "service.name", value: { stringValue: "api" } },
            { key: "env", value: { stringValue: "prod" } },
          ],
          scopeName: "my-tracer",
          scopeVersion: "1.0",
          scopeAttrs: [{ key: "custom.key", value: { stringValue: "val" } }],
          timeUnixNano: ns("1705160354264000000"),
          severityNumber: 9,
          body: "hello world",
          logAttrs: [{ key: "http.method", value: { stringValue: "GET" } }],
          traceId: TRACE_ID,
          spanId: SPAN_ID,
        }),
      );

      expect(result).toEqual([
        {
          id: "0-0-0",
          timestamp: new Date(1705160354264),
          severityNumber: 9,
          body: "hello world",
          attributes: {
            "resource.service.name": "api",
            "resource.env": "prod",
            "scope.name": "my-tracer",
            "scope.version": "1.0",
            "scope.custom.key": "val",
            "http.method": "GET",
            trace_id: "deadbeef00112233445566778899aabb",
            span_id: "cafebabe00010203",
          },
        },
      ]);
    });
  });

  describe("corner cases", () => {
    it("returns [] for empty payload", () => {
      expect(transform({ resourceLogs: [] })).toEqual([]);
    });

    it("skips droppedAttributesCount key in resource attrs", () => {
      const [record] = transform(
        createMockRecord({
          resourceAttrs: [
            { key: "droppedAttributesCount", value: { intValue: 5 } },
          ],
        }),
      );
      expect("resource.droppedAttributesCount" in record.attributes).toBe(
        false,
      );
    });

    it("falls back to observedTimeUnixNano when timeUnixNano is 0", () => {
      const [record] = transform(
        createMockRecord({
          timeUnixNano: 0,
          observedTimeUnixNano: ns("1705160354264000000"),
        }),
      );
      expect(record.timestamp.getTime()).toBe(1705160354264);
    });

    it("log attr with key resource.X overrides resource attr X", () => {
      const [record] = transform(
        createMockRecord({
          resourceAttrs: [
            { key: "service.name", value: { stringValue: "original" } },
          ],
          logAttrs: [
            {
              key: "resource.service.name",
              value: { stringValue: "override" },
            },
          ],
        }),
      );
      expect(record.attributes["resource.service.name"]).toBe("override");
    });
  });
});
