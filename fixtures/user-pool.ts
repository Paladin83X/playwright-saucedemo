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

// WICHTIG: Worker-Scoped Fixtures gehören direkt in den extend-Aufruf.
export const test = base.extend<{
    // Keine Test-Fixtures hier
}, { 
    // Worker-Fixtures
    workerUser: User 
}>({
    // Implementierung der Worker-Fixture
    workerUser: [async ({}, use, workerInfo) => {
        // Falls mehr Worker als User: per Modulo verteilen
        const user = USER_POOL[workerInfo.workerIndex % USER_POOL.length];
        await use(user);
    }, { scope: 'worker' }],
});

export const expect = baseExpect;