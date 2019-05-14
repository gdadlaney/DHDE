## Express Settings -
```javascript
app.use('/static', express.static('static'));
app.use(busboy());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
```

# Endpoints
```javascript
app.get('/api/documents', handleCCDARequest);
app.get(`/${CLINIC_ID}/api/documents/?`, handleCCDATransfer);
app.post('/api/documents', handleUploadCCDA);
app.get('/AddAsset',AddAssetaudit);
app.get('/PatientCCDAUploadAudit',PatientCCDAUploadAudit);
app.get('/PatientAllCCDARequestAudit',PatientAllCCDARequestAudit);
```

## todo: Function Hierarchy