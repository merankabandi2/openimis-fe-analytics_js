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
