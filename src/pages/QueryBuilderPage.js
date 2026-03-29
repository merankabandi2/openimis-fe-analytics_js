import React, { useState } from 'react';
import { connect } from 'react-redux';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  FormControlLabel,
  Switch,
  Box,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/core/styles';
import { useTranslations, useModulesManager, withTooltip, Helmet } from '@openimis/fe-core';
import QueryBuilder from '../components/QueryBuilder';
import { createQuery } from '../actions';

const useStyles = makeStyles((theme) => ({
  page: {
    margin: theme.spacing(3),
  },
  fab: {
    position: 'fixed',
    bottom: theme.spacing(2),
    right: theme.spacing(2),
  },
}));

const QueryBuilderPage = ({ createQuery, history }) => {
  const classes = useStyles();
  const modulesManager = useModulesManager();
  const { formatMessage } = useTranslations('analytics', modulesManager);

  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [queryName, setQueryName] = useState('');
  const [queryDescription, setQueryDescription] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [currentConfig, setCurrentConfig] = useState(null);
  const [currentEntityType, setCurrentEntityType] = useState(null);

  const handleSaveQuery = (entityType, queryConfig) => {
    setCurrentEntityType(entityType);
    setCurrentConfig(queryConfig);
    setSaveDialogOpen(true);
  };

  const handleConfirmSave = async () => {
    if (queryName && currentEntityType && currentConfig) {
      const input = {
        name: queryName,
        description: queryDescription,
        entityType: currentEntityType,
        queryConfig: JSON.stringify(currentConfig),
        isPublic,
      };
      
      await createQuery(input);
      setSaveDialogOpen(false);
      // Redirect to saved queries page
      history.push('/analytics/saved-queries');
    }
  };

  const handleExecuteQuery = (entityType, queryConfig) => {
    // Query execution is handled by the QueryBuilder component
    console.log('Query executed:', entityType, queryConfig);
  };

  return (
    <div className={classes.page}>
      <Helmet title={formatMessage('queryBuilder.pageTitle')} />
      
      <QueryBuilder
        onSave={handleSaveQuery}
        onExecute={handleExecuteQuery}
      />

      {/* Save Query Dialog */}
      <Dialog
        open={saveDialogOpen}
        onClose={() => setSaveDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>{formatMessage('queryBuilder.saveQueryTitle')}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label={formatMessage('queryBuilder.queryName')}
              value={queryName}
              onChange={(e) => setQueryName(e.target.value)}
              fullWidth
              required
              autoFocus
            />
            <TextField
              label={formatMessage('queryBuilder.queryDescription')}
              value={queryDescription}
              onChange={(e) => setQueryDescription(e.target.value)}
              fullWidth
              multiline
              rows={3}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                />
              }
              label={formatMessage('queryBuilder.makePublic')}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSaveDialogOpen(false)}>
            {formatMessage('common.cancel')}
          </Button>
          <Button
            onClick={handleConfirmSave}
            color="primary"
            variant="contained"
            disabled={!queryName}
          >
            {formatMessage('common.save')}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

const mapDispatchToProps = {
  createQuery,
};

export default withTooltip(
  connect(null, mapDispatchToProps)(QueryBuilderPage)
);