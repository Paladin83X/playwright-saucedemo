/**
 * ### User Fixture
 *
 * This fixture provides a dedicated user from a predefined user pool to each worker.
 * It ensures that parallel test execution does not reuse the same user across workers,
 * preventing conflicts (e.g., session overwrites or state leakage).
 *
 * If the number of workers exceeds the available users in the pool,
 * the test run fails immediately with a clear error message.
 *
 * Usage:
 * - Access the assigned `workerUser` in tests to log in with a unique account.
 * - Extend the `USER_POOL` if more parallel workers are needed.
 */

import { test as base, expect as baseExpect } from '@playwright/test';
import type { Page } from '@playwright/test';

export type User = { username: string; password: string; skipLogin?: boolean };

const USER_POOL: User[] = [
    { username: 'standard_user', password: 'secret_sauce' },
    { username: 'locked_out_user', password: 'secret_sauce' },
    { username: 'problem_user', password: 'secret_sauce' },
    { username: 'performance_glitch_user', password: 'secret_sauce' },
    { username: 'error_user', password: 'secret_sauce' },
    { username: 'visual_user', password: 'secret_sauce' },
];

export const test = base.extend<{}, { workerUser: User }>({
    workerUser: [async ({}, use, workerInfo) => {
        // Fail fast if more workers are started than users available in the pool
        if (workerInfo.workerIndex >= USER_POOL.length) {
            throw new Error(
                `Too many workers started: workerIndex=${workerInfo.workerIndex} but user pool has only ${USER_POOL.length} users. ` +
                `Reduce the number of workers to ${USER_POOL.length} or fewer, or extend the user pool.`
            );
        }

        const user = USER_POOL[workerInfo.workerIndex];
        await use(user);
    }, { scope: 'worker' }],
});

export const expect = baseExpect;
