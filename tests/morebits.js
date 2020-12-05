QUnit.module('constants');
QUnit.test('userIsSysop', assert => {
	assert.true(Morebits.userIsSysop, 'Is sysop');
});
QUnit.test('pageNameNorm', assert => {
	assert.strictEqual(Morebits.pageNameNorm, 'Macbeth', 'Normalized page title');
});

QUnit.module('methods');
QUnit.test('userIsInGroup', assert => {
	assert.true(Morebits.userIsInGroup('sysop'), 'Sysop');
	assert.true(Morebits.userIsInGroup('interface-admin'), 'Int-Admin');
	assert.false(Morebits.userIsInGroup('Founder'), 'Founder');
});

QUnit.test('sanitizeIPv6', assert => {
	assert.strictEqual(Morebits.sanitizeIPv6('2001:0db8:0001:0000:0000:0ab9:C0A8:0102'), '2001:DB8:1:0:0:AB9:C0A8:102', 'Shorten IPv6');
	assert.strictEqual(Morebits.sanitizeIPv6('127:0:0:1'), '127:0:0:1', 'Home sweet home');
});

QUnit.test('pageNameRegex', assert => {
	assert.strictEqual(Morebits.pageNameRegex(mw.config.get('wgPageName')), '[Mm]acbeth', 'Normalized page title');
	assert.strictEqual(Morebits.pageNameRegex('foo bar'), '[Ff]oo bar', 'foo bar');
});
QUnit.test('isPageRedirect', assert => {
	assert.false(Morebits.isPageRedirect(), 'Is redirect');
});
