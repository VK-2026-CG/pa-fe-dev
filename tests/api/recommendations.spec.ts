import { expect, test } from '@playwright/test';
import { BFF, getJson, postJson } from '../support/api';

test.describe.serial('BFF recommendations feedback (S-P23-01)', () => {
  test('feedback POST → 204 and round-trips into the panel (AC-P23-01-04)', async ({ request }) => {
    const before = await getJson(request, 'LEADER_P2', `${BFF}/performance/dashboard?scope=SELF`);
    const recommendationId = before.recommendations.panel.recommendationId;
    expect(recommendationId).toBeTruthy();

    const { status } = await postJson(
      request, 'LEADER_P2', `${BFF}/performance/recommendations/${recommendationId}/feedback`, { rating: 'UP' },
    );
    expect(status).toBe(204);

    const after = await getJson(request, 'LEADER_P2', `${BFF}/performance/dashboard?scope=SELF`);
    expect(after.recommendations.panel.feedback).toBe('UP');
  });
});
