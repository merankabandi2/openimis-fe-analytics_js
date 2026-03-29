import React from 'react';
import {
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  IconButton,
} from '@material-ui/core';
import { Delete as DeleteIcon } from '@material-ui/icons';
import { useTranslations, useModulesManager } from '@openimis/fe-core';
import { AGGREGATION_FUNCTIONS } from '../constants';

const AggregationRow = ({ aggregation, fields, onChange, onRemove, className }) => {
  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations('analytics', modulesManager);

  const handleNameChange = (name) => {
    onChange({ ...aggregation, name });
  };

  const handleFunctionChange = (func) => {
    onChange({ ...aggregation, function: func });
  };

  const handleFieldChange = (field) => {
    onChange({ ...aggregation, field });
  };

  return (
    <Grid container spacing={2} alignItems="center" className={className}>
      <Grid item xs={12} sm={3}>
        <TextField
          label={formatMessage('aggregation.name')}
          value={aggregation.name || ''}
          onChange={(e) => handleNameChange(e.target.value)}
          fullWidth
          placeholder={formatMessage('aggregation.namePlaceholder')}
        />
      </Grid>
      <Grid item xs={12} sm={3}>
        <FormControl fullWidth>
          <InputLabel>{formatMessage('aggregation.function')}</InputLabel>
          <Select
            value={aggregation.function || 'count'}
            onChange={(e) => handleFunctionChange(e.target.value)}
          >
            {Object.entries(AGGREGATION_FUNCTIONS).map(([key, value]) => (
              <MenuItem key={value} value={value}>
                {formatMessage(`aggregation.function.${value}`)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={5}>
        <FormControl fullWidth>
          <InputLabel>{formatMessage('aggregation.field')}</InputLabel>
          <Select
            value={aggregation.field || ''}
            onChange={(e) => handleFieldChange(e.target.value)}
          >
            <MenuItem value="id">
              {formatMessage('aggregation.countAll')}
            </MenuItem>
            {fields.map((field) => (
              <MenuItem key={field.name} value={field.name}>
                {field.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid item xs={12} sm={1}>
        <IconButton onClick={onRemove} size="small">
          <DeleteIcon />
        </IconButton>
      </Grid>
    </Grid>
  );
};

export default AggregationRow;