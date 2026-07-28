const fs = require('fs');
const data = JSON.parse(fs.readFileSync('openapi.yaml'));
data.paths['/api/v1/purchases/{id}/cancel'] = {
  post: {
    tags: ['Purchases'],
    summary: 'Cancel confirmed purchase',
    description: 'Reverts a confirmed purchase to DRAFT and undoes inventory updates',
    operationId: 'cancelPurchase',
    parameters: [{name: 'id', in: 'path', required: true, schema: {type: 'integer', format: 'int64'}}],
    responses: {'200': {description: 'OK', content: {'*/*': {schema: {$ref: '#/components/schemas/PurchaseResponse'}}}}}
  }
};
fs.writeFileSync('openapi.yaml', JSON.stringify(data));
