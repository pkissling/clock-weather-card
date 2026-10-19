import { expect, test } from './utils/fixtures'

type SizedCard = HTMLElement & { getCardSize: () => number, getGridOptions: () => object }

const configs = {
  'the default config': undefined,
  'a title': 'title: My Weather',
  'a hidden forecast strip': 'sections: { forecast_strip: { hide: true } }',
  'only the header': 'sections: { forecast_strip: { hide: true }, forecast_list: { hide: true } }',
  'a long forecast list': 'sections: { forecast_list: { count: 10 } }',
  'tall forecast list rows': 'sections: { forecast_list: { row_height: 50px } }',
  'many header rows': `
    sections:
      header:
        rows:
          - { font_size: 5rem, segments: [{ type: time }] }
          - { font_size: 40px, segments: [{ type: date }] }
          - { segments: [{ type: date }] }
  `,
}

test.describe('card size', () => {
  for (const [name, cardConfig] of Object.entries(configs)) {
    test(`reports a masonry size matching the rendered height with ${name}`, async ({ setupCard, clockWeatherCard }) => {
      await setupCard({ cardConfig })

      const { size, height } = await clockWeatherCard.evaluate((el: SizedCard) => ({
        size: el.getCardSize(),
        height: el.getBoundingClientRect().height,
      }))
      expect(Math.abs(size - height / 50))
        .toBeLessThanOrEqual(1)
    })
  }

  test('spans the full section width and can shrink to half of it', async ({ setupCard, clockWeatherCard }) => {
    await setupCard()

    expect(await clockWeatherCard.evaluate((el: SizedCard) => el.getGridOptions()))
      .toEqual({ columns: 12, min_columns: 6 })
  })
})
