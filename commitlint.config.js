export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['Feat', 'Fix', 'Docs', 'Config', 'Test', 'Chore', 'Refactor', 'Build', 'Ci'],
    ],
    'type-case': [2, 'always', 'pascal-case'],
    'subject-empty': [2, 'never'],
    'subject-full-stop': [2, 'never'],
    'subject-max-length': [2, 'always', 50],
    'body-leading-blank': [2, 'always'],
  },
};
