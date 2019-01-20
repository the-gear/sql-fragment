// tslint:disable:no-unsafe-any
import { SqlFragment } from '../sql-fragment';

expect.addSnapshotSerializer({
  test(value) {
    return value && value instanceof SqlFragment;
  },
  print(value, serialize, indent) {
    return [`-- name: ${value.name}`, value.text, `-- values: ${serialize(value.values)}`].join(
      '\n',
    );
  },
});
