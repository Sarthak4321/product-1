import { renderHook, act } from "@testing-library/react";
import { useThrottle, useThrottledCallback } from "../hooks/useThrottle";

describe("useThrottle & useThrottledCallback", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe("useThrottledCallback", () => {
    it("executes immediately on leading edge and throttles subsequent rapid calls", () => {
      const mockFn = jest.fn();
      const { result } = renderHook(() => useThrottledCallback(mockFn, 500));

      act(() => {
        result.current();
        result.current();
        result.current();
      });

      expect(mockFn).toHaveBeenCalledTimes(1);

      act(() => {
        jest.advanceTimersByTime(500);
      });

      act(() => {
        result.current();
      });

      expect(mockFn).toHaveBeenCalledTimes(2);
    });

    it("cancels pending throttled execution on cancel() call", () => {
      const mockFn = jest.fn();
      const { result } = renderHook(() =>
        useThrottledCallback(mockFn, 500, { leading: false, trailing: true })
      );

      act(() => {
        result.current("test");
      });

      act(() => {
        result.current.cancel();
        jest.advanceTimersByTime(500);
      });

      expect(mockFn).not.toHaveBeenCalled();
    });

    it("flushes pending execution on flush() call", () => {
      const mockFn = jest.fn();
      const { result } = renderHook(() =>
        useThrottledCallback(mockFn, 500, { leading: false, trailing: true })
      );

      act(() => {
        result.current("flushed");
      });

      act(() => {
        result.current.flush();
      });

      expect(mockFn).toHaveBeenCalledWith("flushed");
    });
  });

  describe("useThrottle", () => {
    it("returns throttled value according to specified delay interval", () => {
      const { result, rerender } = renderHook(
        ({ val, delay }: { val: string; delay: number }) => useThrottle(val, delay),
        { initialProps: { val: "initial", delay: 500 } }
      );

      expect(result.current).toBe("initial");

      rerender({ val: "updated-1", delay: 500 });
      expect(result.current).toBe("initial");

      act(() => {
        jest.advanceTimersByTime(500);
      });

      expect(result.current).toBe("updated-1");
    });
  });
});
