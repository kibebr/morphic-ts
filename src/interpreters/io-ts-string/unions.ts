import * as t from 'io-ts'
import { IOTSStringType, URI } from '.'
import { ModelAlgebraUnions2 } from '../../algebras/unions'

export const ioTsStringUnionInterpreter: ModelAlgebraUnions2<URI> = {
  union: <L, A>(items: Array<IOTSStringType<L, A>>, name: string) =>
    new IOTSStringType(t.union(items.map(x => x.type) as any, name)) // TODO: fix (follow up: https://github.com/gcanti/io-ts/issues/312)
}
