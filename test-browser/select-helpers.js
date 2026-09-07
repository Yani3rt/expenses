export async function chooseOption(page, control, value) {
  await control.click();
  await page.locator('.custom-select-list:popover-open').locator(`[role="option"][data-value="${value}"]`).click();
}
