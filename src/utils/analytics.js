// Pure helpers shared by the analytics pages. No React or @openimis imports, so
// they run under `node --test`.

const pad = (n) => String(n).padStart(2, '0');

// Date filters compare against date columns: send the calendar day the user
// picked, in local time, as YYYY-MM-DD.
export function toLocalDateString(value) {
  if (value === null || value === undefined || value === '') return value;
  if (typeof value === 'string') return value;
  if (typeof value.format === 'function' && typeof value.toDate === 'function') {
    return value.format('YYYY-MM-DD');
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`;
  }
  return value;
}

export function aggregationName(aggregation) {
  if (aggregation.name && aggregation.name.trim()) return aggregation.name.trim();
  return `${aggregation.function || 'count'}_${aggregation.field || 'id'}`;
}

export function buildQueryConfig({
  filters = [],
  selectedFields = [],
  groupBy = [],
  aggregations = [],
  orderBy = [],
  limit,
}) {
  const config = {
    filters: filters.reduce((acc, filter) => {
      if (filter.field && filter.value !== '' && filter.value !== undefined && filter.value !== null) {
        acc[filter.field] = { operator: filter.operator, value: filter.value };
      }
      return acc;
    }, {}),
    fields: selectedFields.length > 0 ? selectedFields : undefined,
    group_by: groupBy.length > 0 ? groupBy : undefined,
    aggregations: aggregations.reduce((acc, agg) => {
      acc[aggregationName(agg)] = { function: agg.function || 'count', field: agg.field || 'id' };
      return acc;
    }, {}),
    order_by: orderBy.length > 0 ? orderBy : undefined,
    limit,
  };
  Object.keys(config).forEach((key) => {
    const value = config[key];
    if (value === undefined || (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0)) {
      delete config[key];
    }
  });
  return config;
}

// Connection arguments for fe-core's formatPageQueryWithCount, which expects an
// array of GraphQL argument strings.
export function pageArgs({ page = 0, rowsPerPage, orderBy = [] }) {
  const args = [`first: ${rowsPerPage}`];
  if (page > 0) args.push(`offset: ${page * rowsPerPage}`);
  if (orderBy.length) args.push(`orderBy: ${JSON.stringify(orderBy)}`);
  return args;
}

// GraphQL refusals come back as HTTP 200 with an `errors` array.
export function graphqlErrorMessage(payload) {
  const errors = payload && Array.isArray(payload.errors) ? payload.errors : [];
  if (!errors.length) return null;
  return errors.map((e) => (e && e.message) || String(e)).join('; ');
}

// Message of a failed request (network or non-2xx), as stored by the reducer.
export function requestErrorMessage(error) {
  if (!error) return null;
  if (typeof error === 'string') return error;
  return error.message || (error.response && error.response.message) || String(error);
}

export function parseJson(value, fallback) {
  if (value === null || value === undefined || value === '') return fallback;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch (e) {
    return fallback;
  }
}

const isNumeric = (value) => typeof value === 'number' && Number.isFinite(value);

// Chart keys: explicit config keys when the rows carry them, otherwise the first
// numeric column as value and the first other column as category.
export function pickChartKeys(rows, config = {}, categoryConfigKey = 'xAxisKey') {
  if (!rows || !rows.length) return { valueKey: null, categoryKey: null };
  const columns = Object.keys(rows[0]);
  const has = (key) => key && columns.includes(key);
  const valueKey = has(config.dataKey)
    ? config.dataKey
    : columns.find((key) => rows.some((row) => isNumeric(row[key])) && rows.every((row) => row[key] === null || isNumeric(row[key])))
      || null;
  const categoryKey = has(config[categoryConfigKey])
    ? config[categoryConfigKey]
    : columns.find((key) => key !== valueKey) || null;
  return { valueKey, categoryKey };
}

export function widgetLayout(widget) {
  const position = parseJson(widget.position, {}) || {};
  const num = (value, fallback) => (Number.isFinite(Number(value)) && value !== null && value !== '' ? Number(value) : fallback);
  return {
    i: widget.id,
    x: num(position.x, 0),
    y: num(position.y, 0),
    w: num(position.w, 4),
    h: num(position.h, 4),
    minW: 2,
    minH: 2,
  };
}

export function layoutPositions(layout) {
  return layout.reduce((acc, item) => {
    acc[item.i] = { x: item.x, y: item.y, w: item.w, h: item.h };
    return acc;
  }, {});
}

export function hasRight(rights, right) {
  return Array.isArray(rights) && rights.map(Number).includes(Number(right));
}

// Messages raised by be-analytics (analytics/schema.py, analytics/services.py),
// matched as whole strings and shown through the module's translations.
// Values given as { id } are translation keys themselves.
const BACKEND_ERRORS = [
  { pattern: /^Unauthorized$/, id: 'error.unauthorized' },
  { pattern: /^You can only edit your own queries$/, id: 'error.editOwnQueries' },
  { pattern: /^You can only delete your own queries$/, id: 'error.deleteOwnQueries' },
  { pattern: /^This query is used by a dashboard widget and cannot be deleted$/, id: 'error.queryUsedByWidget' },
  { pattern: /^This dashboard is not visible to you$/, id: 'error.dashboardNotVisible' },
  { pattern: /^The query of this widget has been deleted$/, id: 'error.widgetQueryDeleted' },
  { pattern: /^You can only change the layout of your own dashboards$/, id: 'error.layoutOwnDashboards' },
  { pattern: /^You can only change your own dashboards$/, id: 'error.editOwnDashboards' },
  { pattern: /^Making a query (?:or dashboard )?public requires the analytics share right$/, id: 'error.shareRight' },
  { pattern: /^The default dashboard cannot be deleted$/, id: 'error.defaultDashboard' },
  { pattern: /^This query is not visible to you$/, id: 'error.queryNotVisible' },
  { pattern: /^Reading grievance tickets requires the grievance read right$/, id: 'error.grievanceRight' },
  {
    pattern: /^Field '(.+)' is not allowed in (\w+) for entity '(\w+)'$/,
    id: 'error.fieldNotAllowed',
    values: (m) => ({ field: m[1], context: { id: `error.context.${m[2]}` }, entity: { id: `entity.${m[3]}` } }),
  },
  {
    pattern: /^Field '(.+)' in order_by must be one of the group_by fields$/,
    id: 'error.orderByNotGrouped',
    values: (m) => ({ field: m[1] }),
  },
  {
    pattern: /^Filter on date field '(.+)' needs a YYYY-MM-DD value, got '(.*)'$/,
    id: 'error.dateFilterFormat',
    values: (m) => ({ field: m[1], value: m[2] }),
  },
  {
    pattern: /^Export exceeds maximum rows \((\d+)\); add filters or grouping$/,
    id: 'error.exportTooLarge',
    values: (m) => ({ max: m[1] }),
  },
];

function localiseOne(message, formatMessage, formatMessageWithValues) {
  for (const known of BACKEND_ERRORS) {
    const match = known.pattern.exec(message);
    if (!match) continue;
    const raw = known.values ? known.values(match) : {};
    const values = Object.keys(raw).reduce((acc, key) => {
      const value = raw[key];
      acc[key] = value && typeof value === 'object' ? formatMessage(value.id) : value;
      return acc;
    }, {});
    return formatMessageWithValues(known.id, values);
  }
  return null;
}

// Server message (as built by graphqlErrorMessage) in the user's language. Known
// messages are translated; any other part is kept as sent.
export function localiseError(message, formatMessage, formatMessageWithValues) {
  if (!message) return message;
  const text = String(message);
  const whole = localiseOne(text, formatMessage, formatMessageWithValues);
  if (whole !== null) return whole;
  return text
    .split('; ')
    .map((part) => {
      const localised = localiseOne(part, formatMessage, formatMessageWithValues);
      return localised === null ? part : localised;
    })
    .join('; ');
}

// Legend and sector labels: on by default for pie charts, whose sectors carry no
// other name; opt-in for the single-series bar and line charts.
export function chartDisplay(config = {}, widgetType) {
  const isPie = widgetType === 'pie_chart';
  return {
    legend: isPie ? config.showLegend !== false : Boolean(config.showLegend),
    labels: isPie ? config.showLabels !== false : Boolean(config.showLabels),
  };
}

const AXIS_LABEL_MAX = 18;

export function shortLabel(value) {
  const text = String(value);
  return text.length > AXIS_LABEL_MAX ? `${text.slice(0, AXIS_LABEL_MAX)}…` : text;
}

// Rows whose category is null or empty get `emptyLabel`, so the axis tick and the
// legend entry are not blank.
export function withCategoryLabels(rows, categoryKey, emptyLabel) {
  if (!categoryKey || !Array.isArray(rows)) return rows;
  return rows.map((row) => (
    row[categoryKey] === null || row[categoryKey] === undefined || row[categoryKey] === ''
      ? { ...row, [categoryKey]: emptyLabel }
      : row
  ));
}
