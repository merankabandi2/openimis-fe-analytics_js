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
import {
  ENTITY_TYPES,
  FILTER_OPERATORS,
  AGGREGATION_FUNCTIONS,
  EXPORT_FORMATS,
} from '../constants';
import { fetchEntityFields, executeQuery, exportData } from '../actions';
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
}));

const QueryBuilder = ({
  entityType: initialEntityType,
  queryConfig: initialConfig,
  onSave,
  onExecute,
  fetchEntityFields,
  executeQuery,
  exportData,
  entityFields,
  queryResults,
  executingQuery,
  exporting,
  exportUrl,
}) => {
  const classes = useStyles();
  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations('analytics', modulesManager);

  const [entityType, setEntityType] = useState(initialEntityType || '');
  const [filters, setFilters] = useState(initialConfig?.filters || []);
  const [selectedFields, setSelectedFields] = useState(initialConfig?.fields || []);
  const [groupBy, setGroupBy] = useState(initialConfig?.group_by || []);
  const [aggregations, setAggregations] = useState(initialConfig?.aggregations || []);
  const [orderBy, setOrderBy] = useState(initialConfig?.order_by || []);
  const [limit, setLimit] = useState(initialConfig?.limit || 1000);

  // Fetch entity fields when entity type changes
  useEffect(() => {
    if (entityType) {
      fetchEntityFields(entityType);
    }
  }, [entityType, fetchEntityFields]);

  const fields = entityFields[entityType] || [];

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
    setAggregations([...aggregations, { name: '', function: 'count', field: '' }]);
  };

  const handleUpdateAggregation = (index, aggregation) => {
    const newAggregations = [...aggregations];
    newAggregations[index] = aggregation;
    setAggregations(newAggregations);
  };

  const handleRemoveAggregation = (index) => {
    setAggregations(aggregations.filter((_, i) => i !== index));
  };

  const buildQueryConfig = () => {
    const config = {
      filters: filters.reduce((acc, filter) => {
        if (filter.field && filter.value !== '') {
          acc[filter.field] = {
            operator: filter.operator,
            value: filter.value,
          };
        }
        return acc;
      }, {}),
      fields: selectedFields.length > 0 ? selectedFields : undefined,
      group_by: groupBy.length > 0 ? groupBy : undefined,
      aggregations: aggregations.reduce((acc, agg) => {
        if (agg.name && agg.field) {
          acc[agg.name] = {
            function: agg.function,
            field: agg.field,
          };
        }
        return acc;
      }, {}),
      order_by: orderBy.length > 0 ? orderBy : undefined,
      limit,
    };

    // Remove undefined values
    Object.keys(config).forEach((key) => {
      if (config[key] === undefined || (typeof config[key] === 'object' && Object.keys(config[key]).length === 0)) {
        delete config[key];
      }
    });

    return config;
  };

  const handleRunQuery = () => {
    const config = buildQueryConfig();
    executeQuery(entityType, config);
    if (onExecute) {
      onExecute(entityType, config);
    }
  };

  const handleSaveQuery = () => {
    if (onSave) {
      const config = buildQueryConfig();
      onSave(entityType, config);
    }
  };

  const handleExport = (format) => {
    const config = buildQueryConfig();
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
                      {fields.map((field) => (
                        <MenuItem key={field.name} value={field.name}>
                          {field.label}
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
                    onChange={(e) => setLimit(parseInt(e.target.value, 10))}
                    fullWidth
                    InputProps={{ inputProps: { min: 1, max: 100000 } }}
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
                <Tooltip title={formatMessage('queryBuilder.exportPDF')}>
                  <IconButton
                    onClick={() => handleExport('pdf')}
                    disabled={exporting}
                  >
                    <ExportIcon />
                  </IconButton>
                </Tooltip>
              </>
            )}
          </Box>

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
  executingQuery: state.analytics.executingQuery,
  exporting: state.analytics.exporting,
  exportUrl: state.analytics.exportUrl,
});

const mapDispatchToProps = {
  fetchEntityFields,
  executeQuery,
  exportData,
};

export default connect(mapStateToProps, mapDispatchToProps)(QueryBuilder);