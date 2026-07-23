import { expect, test, type Page } from "@playwright/test";

function captureRuntimeErrors(page: Page) {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(`pageerror:${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(`console:${message.text()}`);
  });
  return errors;
}

async function click(page: Page, name: string | RegExp) {
  const control = page.getByRole("button", { name });
  await expect(control).toBeEnabled();
  await control.click();
}

for (const route of ["/", "/demo", "/demo/shopping"]) {
  test(`${route} loads without browser runtime errors`, async ({ page }) => {
    const errors = captureRuntimeErrors(page);
    await page.goto(route);
    await expect(page.getByText("RULE ZERO").first()).toBeVisible();
    await expect(page.locator("main")).toBeVisible();
    expect(errors).toEqual([]);
  });
}

for (const viewport of [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tablet", width: 820, height: 1180 },
  { name: "mobile", width: 390, height: 844 },
]) {
  test(`${viewport.name} guided layout has no horizontal overflow`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto("/demo");
    await expect(page.getByRole("navigation")).toBeVisible();
    await expect(page.getByRole("heading", { name: "Volt Supply" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Run Shopping Agent" })).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(overflow).toBe(false);
    const startBox = await page.getByRole("button", { name: "Run Shopping Agent" }).boundingBox();
    const resetBox = await page.getByRole("button", { name: "Reset" }).boundingBox();
    expect(startBox).not.toBeNull();
    expect(resetBox).not.toBeNull();
    if (startBox && resetBox) {
      const overlaps = !(startBox.x + startBox.width <= resetBox.x || resetBox.x + resetBox.width <= startBox.x || startBox.y + startBox.height <= resetBox.y || resetBox.y + resetBox.height <= startBox.y);
      expect(overlaps).toBe(false);
    }
  });
}

test("keyboard and accessibility smoke", async ({ page }) => {
  await page.goto("/demo");
  await page.keyboard.press("Tab");
  await expect(page.locator(":focus")).toBeVisible();
  const focusStyle = await page.locator(":focus").evaluate((element) => {
    const style = getComputedStyle(element);
    return `${style.outlineStyle}:${style.outlineWidth}:${style.boxShadow}`;
  });
  expect(focusStyle).not.toContain("none:0px:none");
  await expect(page.getByText(/This is a controlled simulation/i)).toBeVisible();
  await expect(page.getByRole("button", { name: "Run Shopping Agent" })).toHaveAccessibleName("Run Shopping Agent");
  await expect(page.getByRole("list", { name: "Demo progress" })).toContainText("MISSION");
});

test("security boundaries remain explicit through the guided browser flow", async ({ page }) => {
  const operationalRequests: string[] = [];
  page.on("request", (request) => {
    if (/\/api\/(worker|interceptor|actions|approvals|recovery)\//.test(request.url())) {
      operationalRequests.push(request.url());
    }
  });
  await page.goto("/demo");
  expect(operationalRequests).toEqual([]);
  await expect(page.getByText(/Run Everything|Auto Approve|Override Block|Execute Blocked Action/i)).toHaveCount(0);

  await click(page, "Run Shopping Agent");
  await click(page, "Check Product Safety");
  await expect(page.getByText("RULE ZERO: ALLOW", { exact: true })).toBeVisible();
  const actionRequestsBefore = operationalRequests.filter((url) => url.includes("/api/actions/execute")).length;
  await page.getByRole("button", { name: "Add Product Safely" }).evaluate((element) => {
    (element as HTMLButtonElement).click();
    (element as HTMLButtonElement).click();
  });
  await expect(page.getByText("RULE ZERO: BLOCKED", { exact: true })).toBeVisible();
  expect(operationalRequests.filter((url) => url.includes("/api/actions/execute"))).toHaveLength(actionRequestsBefore + 1);
  await expect(page.getByRole("button", { name: /override|execute blocked|approve/i })).toHaveCount(0);

  const recoveryRequestsBefore = operationalRequests.filter((url) => url.includes("/api/recovery/execute-step")).length;
  await page.getByRole("button", { name: "Continue Without Membership" }).evaluate((element) => {
    (element as HTMLButtonElement).click();
    (element as HTMLButtonElement).click();
  });
  await expect(page.getByRole("heading", { name: "Payment boundary" })).toBeVisible();
  expect(operationalRequests.filter((url) => url.includes("/api/recovery/execute-step"))).toHaveLength(recoveryRequestsBefore + 1);
  expect(operationalRequests.filter((url) => url.includes("/api/approvals/decide"))).toHaveLength(0);
  await expect(page.getByRole("button", { name: /approve|execute|override/i })).toHaveCount(0);

  await click(page, "Stop Before Payment");
  await expect(page.getByRole("heading", { name: "Task completed safely" })).toBeVisible();

  const beforeReplay = operationalRequests.length;
  await click(page, "View Security Proof");
  await expect(page.getByRole("complementary", { name: "Security proof" })).toBeVisible();
  expect(operationalRequests).toHaveLength(beforeReplay);
  const beforeReset = operationalRequests.length;
  await click(page, "Restart Demo");
  expect(operationalRequests).toHaveLength(beforeReset);
  await expect(page.getByRole("link", { name: "Advanced Security Lab" })).toHaveAttribute("href", "/demo/shopping");
});

test("backend unavailable is an accessible designed error", async ({ page }) => {
  await page.route("**/api/scenarios/shopping-trap/state", (route) => route.abort("connectionrefused"));
  const pageErrors: string[] = [];
  page.on("pageerror", (error) => pageErrors.push(error.message));
  await page.goto("/demo");
  await click(page, "Run Shopping Agent");
  await expect(page.getByRole("alert").filter({hasText:"Demo step failed"})).toContainText("Demo step failed");
  expect(pageErrors).toEqual([]);
});
