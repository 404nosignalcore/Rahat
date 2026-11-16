module.exports = {
  isAvailableAsync: jest.fn(async () => true),
  sendSMSAsync: jest.fn(async (_addresses, _message, _options) => ({ result: 'sent' })),
};
