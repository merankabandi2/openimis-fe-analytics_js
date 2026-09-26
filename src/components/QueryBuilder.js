import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import {
  Card,
  CardHeader,
  CardContent,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  IconButton,
  Chip,
  Paper,
  Typography,
  Box,
  Divider,
  CircularProgress,
  Tooltip,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  PlayArrow as RunIcon,
  Save as SaveIcon,
  GetApp as ExportIcon,
} from '@material-ui/icons';
import { useTranslations, useModulesManager } from '@openimis/fe-core';
import { ENTITY_TYPES, MAX_QUERY_ROWS } from '../constants';
import { fetchEntityFields, executeQuery, exportData } from '../actions';
import { aggregationName, buildQueryConfig, localiseError } from '../utils/analytics';
import FilterRow from './FilterRow';
import AggregationRow from './AggregationRow';
import QueryResults from './QueryResults';

const useStyles = makeStyles((theme) => ({
  root: {
    padding: theme.spacing(2),
  },
  section: {
    marginBottom: theme.spacing(3),
  },
  sectionTitle: {
    marginBottom: theme.spacing(2),
  },
  filterRow: {
    marginBottom: theme.spacing(1),
  },
  addButton: {
    marginTop: theme.spacing(1),
  },
  actionButtons: {
    display: 'flex',
    gap: theme.spacing(2),
    marginTop: theme.spacing(3),
  },
  resultsSection: {
    marginTop: theme.spacing(3),
  },
  error: {
    marginTop: theme.spacing(2),
    padding: theme.spacing(2),
    color: theme.palette.error.main,
    borderLeft: `4px solid ${theme.palette.error.main}`,
  },
  notice: {
    marginTop: theme.spacing(2),
    padding: theme.spacing(2),
    borderLeft: `4px solid ${theme.palette.primary.main}`,
  },
}));

const QueryBuilder = ({
  entityType: initialEntityType,
  queryConfig: initialConfig,
  autoRun,
  onSave,
  onExecute,
  fetchEntityFields,
  executeQuery,
  exportData,
  entityFields,
  queryResults,
  queryError,
  executingQuery,
  exporting,
  exportUrl,
  exportRowCount,
  exportError,
}) => {
  const classes = useStyles();
  const modulesManager = useModulesManager();
  const { formatMessage, formatMessageWithValues } = useTranslations('analytics', modulesManager);
  const localise = (message) => localiseError(message, formatMessage, formatMessageWithValues);

  // Normalise inputs coming from SavedQueriesPage — the API exposes the entity_type
  // as an uppercased enum and seeded queries may use legacy "dimensions"/"measures"
  // rather than "group_by"/"aggregations".
  const normalisedInitialEntity = (initialEntityType || '').toLowerCase();
  const legacyGroupBy = initialConfig?.dimensions;
  const legacyMeasures = initialConfig?.measures;
  const legacyFilters = initialConfig?.filters;

  const [entityType, setEntityType] = useState(normalisedInitialEntity || '');
  // Accept filters as either array (builder UI form) or object keyed by field (stored form).
  const parsedFilters = Array.isArray(legacyFilters)
    ? legacyFilters
    : legacyFilters && typeof legacyFilters === 'object'
      ? Object.entries(legacyFilters).map(([field, cond]) => ({
        field,
        operator: (cond && cond.operator) || 'exact',
        value: cond && cond.value !== undefined ? cond.value : '',
      }))
      : [];
  const parsedGroupBy = initialConfig?.group_by || (Array.isArray(legacyGroupBy) ? legacyGroupBy : []);
  // Materialise seeded `measures: ["count"]` into builder aggregation rows.
  const parsedAggregations = initialConfig?.aggregations && (
    Array.isArray(initialConfig.aggregations)
      ? initialConfig.aggregations
      : Object.entries(initialConfig.aggregations).map(([name, cfg]) => ({
        name, function: cfg.function, field: cfg.field,
      }))
  ) || (Array.isArray(legacyMeasures)
    ? legacyMeasures.map((m) => (typeof m === 'string'
      ? { name: `${m}_value`, function: m, field: 'id' }
      : { name: m.name || `${m.function}_${m.field || 'id'}`, function: m.function || 'count', field: m.field || 'id' }))
    : []
  );
  const [filters, setFilters] = useState(parsedFilters);
  const [selectedFields, setSelectedFields] = useState(initialConfig?.fields || []);
  const [groupBy, setGroupBy] = useState(parsedGroupBy);
  const [aggregations, setAggregations] = useState(parsedAggregations);
  const [orderBy, setOrderBy] = useState(initialConfig?.order_by || []);
  const [limit, setLimit] = useState(initialConfig?.limit || 1000);

  // Fetch entity fields when entity type changes
  useEffect(() => {
    if (entityType) {
      fetchEntityFields(entityType);
    }
  }, [entityType, fetchEntityFields]);

  // Auto-run the query when navigating from SavedQueriesPage "Run" action.
  const [hasAutoRun, setHasAutoRun] = useState(false);
  useEffect(() => {
    if (autoRun && !hasAutoRun && entityType) {
      setHasAutoRun(true);
      const config = buildQueryConfig({
        filters, selectedFields, groupBy, aggregations, orderBy, limit,
      });
      executeQuery(entityType, config);
    }
  }, [autoRun, hasAutoRun, entityType, filters, selectedFields, groupBy, aggregations, orderBy, limit, executeQuery]);

  const fields = entityFields[entityType] || [];

  // Sortable columns of the result: grouped fields (or all fields when not
  // grouping) and the aggregation names, each ascending or descending.
  const sortableColumns = [
    ...(groupBy.length ? fields.filter((f) => groupBy.includes(f.name)) : fields)
      .map((f) => ({ name: f.name, label: f.label })),
    ...(groupBy.length ? aggregations.map((a) => ({ name: aggregationName(a), label: aggregationName(a) })) : []),
  ];
  const orderOptions = sortableColumns.flatMap((column) => [
    { value: column.name, label: `${column.label} ${formatMessage('queryBuilder.ascending')}` },
    { value: `-${column.name}`, label: `${column.label} ${formatMessage('queryBuilder.descending')}` },
  ]);

  const handleEntityTypeChange = (event) => {
    setEntityType(event.target.value);
    // Reset query configuration
    setFilters([]);
    setSelectedFields([]);
    setGroupBy([]);
    setAggregations([]);
    setOrderBy([]);
  };

  const handleAddFilter = () => {
    setFilters([...filters, { field: '', operator: 'exact', value: '' }]);
  };

  const handleUpdateFilter = (index, filter) => {
    const newFilters = [...filters];
    newFilters[index] = filter;
    setFilters(newFilters);
  };

  const handleRemoveFilter = (index) => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  const handleAddAggregation = () => {
    setAggregations([...aggregations, { name: '', function: 'count', field: 'id' }]);
  };

  const handleUpdateAggregation = (index, aggregation) => {
    const newAggregations = [...aggregations];
    newAggregations[index] = aggregation;
    setAggregations(newAggregations);
  };

  const handleRemoveAggregation = (index) => {
    setAggregations(aggregations.filter((_, i) => i !== index));
  };

  const currentQueryConfig = () => buildQueryConfig({
    filters, selectedFields, groupBy, aggregations, orderBy, limit: limit || 1000,
  });

  const handleRunQuery = () => {
    const config = currentQueryConfig();
    executeQuery(entityType, config);
    if (onExecute) {
      onExecute(entityType, config);
    }
  };

  const handleSaveQuery = () => {
    if (onSave) {
      const config = currentQueryConfig();
      onSave(entityType, config);
    }
  };

  const handleExport = (format) => {
    const config = currentQueryConfig();
    exportData(entityType, config, format);
  };

  // Download export when URL is available
  useEffect(() => {
    if (exportUrl) {
      window.open(exportUrl, '_blank');
    }
  }, [exportUrl]);

  return (
    <div className={classes.root}>
      {/* Entity Type Selection */}
      <Paper className={classes.section}>
        <Box p={2}>
          <Typography variant="h6" className={classes.sectionTitle}>
            {formatMessage('queryBuilder.selectEntity')}
          </Typography>
          <FormControl fullWidth>
            <InputLabel>{formatMessage('queryBuilder.entityType')}</InputLabel>
            <Select
              value={entityType}
              onChange={handleEntityTypeChange}
            >
              {Object.entries(ENTITY_TYPES).map(([key, value]) => (
                <MenuItem key={value} value={value}>
                  {formatMessage(`entity.${value}`)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {entityType && (
        <>
          {/* Filters */}
          <Paper className={classes.section}>
            <Box p={2}>
              <Typography variant="h6" className={classes.sectionTitle}>
                {formatMessage('queryBuilder.filters')}
              </Typography>
              {filters.map((filter, index) => (
                <FilterRow
                  key={index}
                  filter={filter}
                  fields={fields}
                  onChange={(updatedFilter) => handleUpdateFilter(index, updatedFilter)}
                  onRemove={() => handleRemoveFilter(index)}
                  className={classes.filterRow}
                />
              ))}
              <Button
                startIcon={<AddIcon />}
                onClick={handleAddFilter}
                className={classes.addButton}
                color="primary"
              >
                {formatMessage('queryBuilder.addFilter')}
              </Button>
            </Box>
          </Paper>

          {/* Field Selection */}
          <Paper className={classes.section}>
            <Box p={2}>
              <Typography variant="h6" className={classes.sectionTitle}>
                {formatMessage('queryBuilder.selectFields')}
              </Typography>
              <FormControl fullWidth>
                <InputLabel>{formatMessage('queryBuilder.fields')}</InputLabel>
                <Select
                  multiple
                  value={selectedFields}
                  onChange={(e) => setSelectedFields(e.target.value)}
                  renderValue={(selected) => (
                    <Box display="flex" flexWrap="wrap" gap={0.5}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {fields.map((field) => (
                    <MenuItem key={field.name} value={field.name}>
                      {field.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          </Paper>

          {/* Grouping and Aggregation */}
          <Paper className={classes.section}>
            <Box p={2}>
              <Typography variant="h6" className={classes.sectionTitle}>
                {formatMessage('queryBuilder.groupingAggregation')}
              </Typography>
              
              {/* Group By */}
              <FormControl fullWidth style={{ marginBottom: 16 }}>
                <InputLabel>{formatMessage('queryBuilder.groupBy')}</InputLabel>
                <Select
                  multiple
                  value={groupBy}
                  onChange={(e) => setGroupBy(e.target.value)}
                  renderValue={(selected) => (
                    <Box display="flex" flexWrap="wrap" gap={0.5}>
                      {selected.map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {fields.map((field) => (
                    <MenuItem key={field.name} value={field.name}>
                      {field.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Aggregations */}
              <Typography variant="subtitle2" gutterBottom>
                {formatMessage('queryBuilder.aggregations')}
              </Typography>
              {aggregations.map((aggregation, index) => (
                <AggregationRow
                  key={index}
                  aggregation={aggregation}
                  fields={fields.filter(f => f.aggregatable)}
                  onChange={(updated) => handleUpdateAggregation(index, updated)}
                  onRemove={() => handleRemoveAggregation(index)}
                  className={classes.filterRow}
                />
              ))}
              <Button
                startIcon={<AddIcon />}
                onClick={handleAddAggregation}
                className={classes.addButton}
                size="small"
              >
                {formatMessage('queryBuilder.addAggregation')}
              </Button>
            </Box>
          </Paper>

          {/* Query Options */}
          <Paper className={classes.section}>
            <Box p={2}>
              <Typography variant="h6" className={classes.sectionTitle}>
                {formatMessage('queryBuilder.queryOptions')}
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>{formatMessage('queryBuilder.orderBy')}</InputLabel>
                    <Select
                      multiple
                      value={orderBy}
                      onChange={(e) => setOrderBy(e.target.value)}
                      renderValue={(selected) => (
                        <Box display="flex" flexWrap="wrap" gap={0.5}>
                          {selected.map((value) => (
                            <Chip key={value} label={value} size="small" />
                          ))}
                        </Box>
                      )}
                    >
                      {orderOptions.map((option) => (
                        <MenuItem key={option.value} value={option.value}>
                          {option.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    type="number"
                    label={formatMessage('queryBuilder.limit')}
                    value={limit}
                    onChange={(e) => setLimit(
                      e.target.value === '' ? '' : Math.min(MAX_QUERY_ROWS, Math.max(1, parseInt(e.target.value, 10) || 1)),
                    )}
                    fullWidth
                    helperText={formatMessageWithValues('queryBuilder.limitHelp', { max: MAX_QUERY_ROWS })}
                    InputProps={{ inputProps: { min: 1, max: MAX_QUERY_ROWS } }}
                  />
                </Grid>
              </Grid>
            </Box>
          </Paper>

          {/* Action Buttons */}
          <Box className={classes.actionButtons}>
            <Button
              variant="contained"
              color="primary"
              startIcon={executingQuery ? <CircularProgress size={20} /> : <RunIcon />}
              onClick={handleRunQuery}
              disabled={executingQuery}
            >
              {formatMessage('queryBuilder.runQuery')}
            </Button>
            {onSave && (
              <Button
                variant="outlined"
                startIcon={<SaveIcon />}
                onClick={handleSaveQuery}
              >
                {formatMessage('queryBuilder.saveQuery')}
              </Button>
            )}
            <Box flexGrow={1} />
            {queryResults && (
              <>
                <Tooltip title={formatMessage('queryBuilder.exportExcel')}>
                  <IconButton
                    onClick={() => handleExport('excel')}
                    disabled={exporting}
                  >
                    <ExportIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title={formatMessage('queryBuilder.exportCSV')}>
                  <IconButton
                    onClick={() => handleExport('csv')}
                    disabled={exporting}
                  >
                    <ExportIcon />
                  </IconButton>
                </Tooltip>
              </>
            )}
          </Box>

          {queryError && (
            <Paper className={classes.error} role="alert">
              <Typography variant="body2">
                {formatMessageWithValues('queryBuilder.queryError', { error: localise(queryError) })}
              </Typography>
            </Paper>
          )}
          {exportError && (
            <Paper className={classes.error} role="alert">
              <Typography variant="body2">
                {formatMessageWithValues('queryBuilder.exportError', { error: localise(exportError) })}
              </Typography>
            </Paper>
          )}
          {exportUrl && exportRowCount !== null && (
            <Paper className={classes.notice}>
              <Typography variant="body2">
                {formatMessageWithValues('queryBuilder.exportDone', { count: exportRowCount })}
              </Typography>
            </Paper>
          )}

          {/* Query Results */}
          {queryResults && (
            <Paper className={classes.resultsSection}>
              <QueryResults
                results={queryResults}
                entityType={entityType}
              />
            </Paper>
          )}
        </>
      )}
    </div>
  );
};

const mapStateToProps = (state) => ({
  entityFields: state.analytics.entityFields,
  queryResults: state.analytics.queryResults,
  queryError: state.analytics.queryError,
  executingQuery: state.analytics.executingQuery,
  exporting: state.analytics.exporting,
  exportUrl: state.analytics.exportUrl,
  exportRowCount: state.analytics.exportRowCount,
  exportError: state.analytics.exportError,
});

const mapDispatchToProps = {
  fetchEntityFields,
  executeQuery,
  exportData,
};

export default connect(mapStateToProps, mapDispatchToProps)(QueryBuilder);