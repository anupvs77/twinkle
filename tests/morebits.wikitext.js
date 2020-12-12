QUnit.module('Morebits.wikitext');
QUnit.test('parseTemplate', assert => {
	// Function to help build a template from a sample object
	var makeTemplate = function(data) {
		var template = '{{' + data.name;
		Object.keys(data.parameters).forEach(function(key) {
			template += '|' + key + '=' + data.parameters[key];
		});
		return template + '}}';
	};

	var simple = {
		name: 'prod',
		parameters: {
			reason: 'because',
			morereason: 'I said so',
			timestamp: '42'
		}};
	assert.deepEqual(Morebits.wikitext.parseTemplate('Template: ' + makeTemplate(simple) + ' in text', 10), simple, 'Basic parameters');

	var involved = {
		name: 'Proposed deletion/dated',
		parameters: {
			concern: 'Text (paren) then [[piped|link]] and [[WP:WP/LINK]] {{{plural|with|a|template}}} then question?',
			timestamp: '20380119031407',
			nom: 'Jimbo Wales',
			help: 'off'
		}};
	assert.deepEqual(Morebits.wikitext.parseTemplate(makeTemplate(involved)), involved, 'Involved parameters');

	// Try a variety of whitespace options
	var whitespace = '{{' + involved.name + ' |concern = ' + involved.parameters.concern + ' | timestamp =' + involved.parameters.timestamp + '| nom= ' + involved.parameters.nom + '|help = ' + involved.parameters.help + ' }}';
	assert.deepEqual(Morebits.wikitext.parseTemplate(whitespace), involved, 'Involved parameters with whitespace');

	var unnamed = {
		name: 'db-meta',
		parameters: {
			criterion: 'G13',
			1: ' reason ', // Note the surrounding whitespace, unnamed parameters can retain these
			middle: '',
			2: 'extra'
		}
	};
	var unnamedTemplate = '{{' + unnamed.name + '|criterion=' + unnamed.parameters.criterion + '||' + unnamed.parameters['1'] + '| middle =|2= ' + unnamed.parameters['2'] + '|}}';
	assert.deepEqual(Morebits.wikitext.parseTemplate(unnamedTemplate), unnamed, 'Unnamed and empty parameters');

	var multiLevel = {
		name: 'toplevel',
		parameters: {
			named: 'namedtop',
			other: '{{{namedintro|{{{3|asd}}}|really=yes|a}}}',
			1: 'onetop',
			final: '{{{last|iswear}}}'
		}
	};
	assert.deepEqual(Morebits.wikitext.parseTemplate(makeTemplate(multiLevel)), multiLevel, 'Multiple levels');
	var parser = {
		name: 'toplevel',
		parameters: {
			named: 'namedtop',
			other: '{{#if:{{{namedintro|{{{3|asd}}}|really=yes|a}}}|true|false}}',
			1: 'onetop',
			final: '{{{last|iswear}}}'
		}
	};
	assert.deepEqual(Morebits.wikitext.parseTemplate(makeTemplate(parser)), parser, 'Parser function');

	var internal = {
		name: 'internal',
		parameters: {
			named: 'parameter {{tq|with an internal}} template',
			other: '{{#if:{{{namedintro|{{{3|asd}}}|really=yes|a}}}|true|false}}',
			1: 'onetop',
			final: '{{{last|iswear}}}'
		}
	};
	assert.deepEqual(Morebits.wikitext.parseTemplate(makeTemplate(internal)), internal, 'Internal templates');
});

QUnit.test('Morebits.wikitext.page', assert => {
	var text = '{{short description}}{{about}}[[File:Fee.svg]]O, [[Juliet|she]] doth {{plural|teach}} the torches to burn bright!';
	var page = new Morebits.wikitext.page(text);
	assert.true(page instanceof Morebits.wikitext.page, 'Correct instance');
	assert.strictEqual(page.getText(), text, 'Got text');

	// Throws
	assert.throws(() => new Morebits.wikitext.page(text).insertAfterTemplates(), 'throws: no tag');
	assert.throws(() => new Morebits.wikitext.page(text).insertAfterTemplates('tag'), 'throws: no regex');

	// Define all the tests individually, with the appropriate method,
	// input, expected output, and (spreaded) parameters.
	var tests = [
		{
			name: 'simple',
			method: 'removeLink',
			input: text,
			expected: '{{short description}}{{about}}[[File:Fee.svg]]O, she doth {{plural|teach}} the torches to burn bright!',
			params: ['juliet']
		},
		{
			name: 'simple',
			method: 'commentOutImage',
			input: text,
			expected: '{{short description}}{{about}}<!-- too pretty: [[File:Fee.svg]] -->O, [[Juliet|she]] doth {{plural|teach}} the torches to burn bright!',
			params: ['Fee.svg', 'too pretty']
		},
		{
			name: 'simple',
			method: 'addToImageComment',
			input: text,
			expected: '{{short description}}{{about}}[[File:Fee.svg|thumb|size=42]]O, [[Juliet|she]] doth {{plural|teach}} the torches to burn bright!',
			params: ['Fee.svg', 'thumb|size=42']
		},
		{
			name: 'simple',
			method: 'removeTemplate',
			input: text,
			expected: '{{short description}}{{about}}[[File:Fee.svg]]O, [[Juliet|she]] doth  the torches to burn bright!',
			params: ['plural']
		},
		{
			name: 'simple',
			method: 'insertAfterTemplates',
			input: text,
			expected: '{{short description}}{{about}}{{newtag}}[[File:Fee.svg]]O, [[Juliet|she]] doth {{plural|teach}} the torches to burn bright!',
			params: ['{{newtag}}', 'short description|about']
		},
		{
			name: 'multiple',
			method: 'removeLink',
			input: 'O, [[Juliet|she]] [[juliet|doth]] {{plural|teach}} [[Romeo|the]] [[:Juliet|torches]] [[juliet|to]] burn bright!',
			expected: 'O, she doth {{plural|teach}} [[Romeo|the]] torches to burn bright!',
			params: ['juliet']
		},
		{
			name: 'multiple',
			method: 'addToImageComment',
			input: 'O, [[File:Fee.svg]] she [[File:Fee.svg|doth|teach]] the [[File:Fee.svg|torches]] to burn bright!',
			expected: 'O, [[File:Fee.svg|thumb|size=42|test]] she [[File:Fee.svg|doth|teach|thumb|size=42|test]] the [[File:Fee.svg|torches|thumb|size=42|test]] to burn bright!',
			params: ['Fee.svg', ['thumb', 'size=42', 'test'].join('|')]
		},
		{
			name: 'preRegex',
			method: 'insertAfterTemplates',
			input: '{{short description}}{{About}}<!-- random -->{{xfd}}O, [[Juliet|she]] doth {{plural|teach}} the torches to burn bright!',
			expected: '{{short description}}{{About}}<!-- random -->{{xfd}}{{newtag}}O, [[Juliet|she]] doth {{plural|teach}} the torches to burn bright!',
			params: ['{{newtag}}', 'short description|about|Juliet|xfd', null, ['<!-- random -->', '<!-- comment -->']]
		},
		{
			name: 'Forgot the preRegex',
			method: 'insertAfterTemplates',
			input: '{{short description}}{{About}}<!-- random -->{{xfd}}O, [[Juliet|she]] doth {{plural|teach}} the torches to burn bright!',
			expected: '{{short description}}{{About}}{{newtag}}<!-- random -->{{xfd}}O, [[Juliet|she]] doth {{plural|teach}} the torches to burn bright!',
			params: ['{{newtag}}', 'short description|about|Juliet|xfd']
		},
		{
			name: 'File links not displays',
			method: 'removeLink',
			input: 'O, [[:File:Fee.svg|she]] [[File:Fee.svg|doth]] {{plural|teach}} [[:File:Fee.svg|the]] [[File:Fee.svg|torches]] [[Fee.svg|to]] burn bright!',
			expected: 'O, she [[File:Fee.svg|doth]] {{plural|teach}} the [[File:Fee.svg|torches]] [[Fee.svg|to]] burn bright!',
			params: ['File:Fee.svg']
		},
		{
			name: 'File displays not links',
			method: 'commentOutImage',
			input: 'O, [[:File:Fee.svg|she]] [[File:Fee.svg|doth]] {{plural|teach}} [[:File:Fee.svg|the]] [[File:Fee.svg|torches]] [[Fee.svg|to]] burn bright!',
			expected: 'O, [[:File:Fee.svg|she]] <!-- reason: [[File:Fee.svg|doth]] --> {{plural|teach}} [[:File:Fee.svg|the]] <!-- reason: [[File:Fee.svg|torches]] --> [[Fee.svg|to]] burn bright!',
			params: ['Fee.svg', 'reason']
		},
		{
			name: 'File displays not links',
			method: 'addToImageComment',
			input: 'O, [[:File:Fee.svg|she]] [[File:Fee.svg|doth]] {{plural|teach}} [[:File:Fee.svg|the]] [[File:Fee.svg|torches]] [[Fee.svg|to]] burn bright!',
			expected: 'O, [[:File:Fee.svg|she]] [[File:Fee.svg|doth|size=42]] {{plural|teach}} [[:File:Fee.svg|the]] [[File:Fee.svg|torches|size=42]] [[Fee.svg|to]] burn bright!',
			params: ['Fee.svg', 'size=42']
		},
		{
			name: 'Image or file',
			method: 'commentOutImage',
			input: 'O, [[File:Fee.svg|she]] [[Image:Fee.svg|doth]] {{plural|teach}} [[:File:Fee.svg|the]] [[Image:Fee.svg|torches]] [[Fee.svg|to]] burn bright!',
			expected: 'O, <!-- [[File:Fee.svg|she]] --> <!-- [[Image:Fee.svg|doth]] --> {{plural|teach}} [[:File:Fee.svg|the]] <!-- [[Image:Fee.svg|torches]] --> [[Fee.svg|to]] burn bright!',
			params: ['Fee.svg']
		},
		{
			name: 'Image or file',
			method: 'addToImageComment',
			input: 'O, [[File:Fee.svg|she]] [[Image:Fee.svg|doth]] {{plural|teach}} [[:File:Fee.svg|the]] [[Image:Fee.svg|torches]] [[Fee.svg|to]] burn bright!',
			expected: 'O, [[File:Fee.svg|she|size=42]] [[Image:Fee.svg|doth|size=42]] {{plural|teach}} [[:File:Fee.svg|the]] [[Image:Fee.svg|torches|size=42]] [[Fee.svg|to]] burn bright!',
			params: ['Fee.svg', 'size=42']
		},
		{
			name: 'Alt namespace',
			method: 'removeTemplate',
			input: 'O, she doth {{User:ThisIsaTest/plural|teach}} the torches to burn bright!',
			expected: 'O, she doth  the torches to burn bright!',
			params: ['User:ThisIsaTest/plural']
		},
		{
			name: 'Template namespace',
			method: 'removeTemplate',
			input: 'O, she doth {{Template:plural|teach}} the torches to burn bright!',
			expected: 'O, she doth  the torches to burn bright!',
			params: ['Template:plural']
		}
	];

	tests.forEach((test) => {
		var page = new Morebits.wikitext.page(test.input);
		assert.strictEqual(page[test.method](...test.params).getText(), test.expected, test.method + ' - ' + test.name);
	});
});