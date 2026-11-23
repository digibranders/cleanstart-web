type Core = typeof import("echarts/core");

let loading: Promise<Core> | null = null;

/** Loads ECharts once, with only the chart types and components the portal draws. The import is dynamic so pages without a chart never download it. */
export function loadEcharts(): Promise<Core> {
  loading ??= (async (): Promise<Core> => {
    const [core, charts, components, renderers] = await Promise.all([
      import("echarts/core"),
      import("echarts/charts"),
      import("echarts/components"),
      import("echarts/renderers"),
    ]);
    core.use([
      charts.BarChart,
      charts.LineChart,
      charts.PieChart,
      charts.ScatterChart,
      charts.CustomChart,
      components.GridComponent,
      components.TooltipComponent,
      components.MarkLineComponent,
      components.MarkPointComponent,
      components.GraphicComponent,
      components.AriaComponent,
      renderers.CanvasRenderer,
    ]);
    return core;
  })();
  return loading;
}
