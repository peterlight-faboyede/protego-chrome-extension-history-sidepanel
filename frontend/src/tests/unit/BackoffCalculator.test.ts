import { describe, it, expect } from 'vitest';
import { BackoffCalculator } from '../../background/BackoffCalculator';

describe('BackoffCalculator', () => {
    const config = {
        baseInterval: 1000,
        maxInterval: 300000,
        maxRetries: 5,
    };

    it('should calculate backoff interval with exponential growth', () => {
        const calculator = new BackoffCalculator(config);

        expect(calculator.calculateInterval(0)).toBe(1000);
        expect(calculator.calculateInterval(1)).toBe(2000);
        expect(calculator.calculateInterval(2)).toBe(4000);
        expect(calculator.calculateInterval(3)).toBe(8000);
        expect(calculator.calculateInterval(4)).toBe(16000);
    });

    it('should cap backoff interval at maxInterval', () => {
        const calculator = new BackoffCalculator(config);

        expect(calculator.calculateInterval(10)).toBe(300000);
        expect(calculator.calculateInterval(20)).toBe(300000);
    });

    it('should determine if retry is allowed', () => {
        const calculator = new BackoffCalculator(config);

        expect(calculator.shouldRetry(0)).toBe(true);
        expect(calculator.shouldRetry(4)).toBe(true);
        expect(calculator.shouldRetry(5)).toBe(false);
        expect(calculator.shouldRetry(10)).toBe(false);
    });

    it('should return max retries', () => {
        const calculator = new BackoffCalculator(config);

        expect(calculator.getMaxRetries()).toBe(5);
    });

    it('should handle different config values', () => {
        const customCalculator = new BackoffCalculator({
            baseInterval: 5000,
            maxInterval: 60000,
            maxRetries: 3,
        });

        expect(customCalculator.calculateInterval(0)).toBe(5000);
        expect(customCalculator.calculateInterval(1)).toBe(10000);
        expect(customCalculator.calculateInterval(2)).toBe(20000);
        expect(customCalculator.calculateInterval(3)).toBe(40000);
        expect(customCalculator.calculateInterval(4)).toBe(60000);
        expect(customCalculator.shouldRetry(2)).toBe(true);
        expect(customCalculator.shouldRetry(3)).toBe(false);
    });
});

