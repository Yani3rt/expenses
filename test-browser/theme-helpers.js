export async function selectTheme(page, value) {
  await page.getByRole('button', { name: 'Visual theme', exact: true }).click();
  await page.getByRole('menuitemradio', { name: value === 'momentum' ? 'Momentum' : 'Classic', exact: true }).click();
}
