import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { isXUserIdAllowed } from './securityConfig.js';

const SNAPSHOT_NODE_ENV = process.env.NODE_ENV;
const SNAPSHOT_ALLOW_X_USER_ID = process.env.ALLOW_X_USER_ID;

describe('isXUserIdAllowed', () => {
  beforeEach(() => {
    delete process.env.ALLOW_X_USER_ID;
  });

  afterEach(() => {
    process.env.NODE_ENV = SNAPSHOT_NODE_ENV;
    if (SNAPSHOT_ALLOW_X_USER_ID === undefined) delete process.env.ALLOW_X_USER_ID;
    else process.env.ALLOW_X_USER_ID = SNAPSHOT_ALLOW_X_USER_ID;
  });

  it('production sans variable → false', () => {
    process.env.NODE_ENV = 'production';
    delete process.env.ALLOW_X_USER_ID;
    expect(isXUserIdAllowed()).toBe(false);
  });

  it('production + ALLOW_X_USER_ID=true → true', () => {
    process.env.NODE_ENV = 'production';
    process.env.ALLOW_X_USER_ID = 'true';
    expect(isXUserIdAllowed()).toBe(true);
  });

  it('test / dev sans variable → true', () => {
    process.env.NODE_ENV = 'test';
    delete process.env.ALLOW_X_USER_ID;
    expect(isXUserIdAllowed()).toBe(true);
  });

  it('test + ALLOW_X_USER_ID=false → false', () => {
    process.env.NODE_ENV = 'test';
    process.env.ALLOW_X_USER_ID = 'false';
    expect(isXUserIdAllowed()).toBe(false);
  });
});
