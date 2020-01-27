import { InterpreterResult, InterpreterURI } from './InterpreterResult'
import { assignFunction, TagsOf } from './utils'
import { ADT, KeysDefinition, Tagged, makeADT } from '../adt'
import { MonocleFor } from '../adt/monocle'
import { ProgramURI, ProgramType } from './ProgramType'

export interface ProgramInterpreter<ProgURI extends ProgramURI, InterpURI extends InterpreterURI> {
  <E, A>(program: ProgramType<E, A>[ProgURI]): InterpreterResult<E, A>[InterpURI]
}
export type ProgramURIOfProgramInterpreter<X extends ProgramInterpreter<any, any>> = X extends ProgramInterpreter<
  infer P,
  any
>
  ? P
  : never

export type InterpreterURIOfProgramInterpreter<X extends ProgramInterpreter<any, any>> = X extends ProgramInterpreter<
  any,
  infer R
>
  ? R
  : never

export type Morph<E, A, InterpURI extends InterpreterURI, ProgURI extends ProgramURI> = InterpreterResult<
  E,
  A
>[InterpURI] &
  ProgramType<E, A>[ProgURI]

const assignCallable = <C, F extends Function & C, D>(F: F, d: D): F & C & D =>
  assignFunction(F, Object.assign({}, F, d))

const wrapFun = <A, B, X>(g: ((a: A) => B) & X): typeof g => ((x: any) => g(x)) as any

function interpreteWithProgram<E, A, ProgURI extends ProgramURI, InterpURI extends InterpreterURI>(
  program: ProgramType<E, A>[ProgURI],
  programInterpreter: ProgramInterpreter<ProgURI, InterpURI>
): Morph<E, A, InterpURI, ProgURI> & InhabitedTypes<E, A> {
  return inhabitTypes(assignFunction(wrapFun(program), programInterpreter(program)))
}

export type MorphADT<
  E,
  A,
  Tag extends keyof A & string,
  ProgURI extends ProgramURI,
  InterpURI extends InterpreterURI
> = ADT<A, Tag> & Morph<E, A, InterpURI, ProgURI>

export interface TaggableAsADT<E, A, ProgURI extends ProgramURI, InterpURI extends InterpreterURI> {
  tagged: <Tag extends TagsOf<A>>(tag: Tag) => (keys: KeysDefinition<A, Tag>) => MorphADT<E, A, Tag, ProgURI, InterpURI>
}

export type Materialized<E, A, ProgURI extends ProgramURI, InterpURI extends InterpreterURI> = Morph<
  E,
  A,
  InterpURI,
  ProgURI
> &
  MonocleFor<A> &
  TaggableAsADT<E, A, ProgURI, InterpURI> &
  InhabitedTypes<E, A>

export interface InhabitedTypes<E, A> {
  // tslint:disable-next-line: no-unused-expression
  _E: E
  // tslint:disable-next-line: no-unused-expression
  _A: A
}
export type AType<X extends InhabitedTypes<any, any>> = X['_A']
export type EType<X extends InhabitedTypes<any, any>> = X['_E']

/**
 * Fake inhabitation of types
 */
const inhabitTypes = <E, A, T>(t: T): T & InhabitedTypes<E, A> => t as any

export function materialize<E, A, ProgURI extends ProgramURI, InterpURI extends InterpreterURI>(
  program: ProgramType<E, A>[ProgURI],
  programInterpreter: ProgramInterpreter<ProgURI, InterpURI>
): Materialized<E, A, ProgURI, InterpURI> {
  return withTaggableAndMonocle(interpreteWithProgram(program, programInterpreter))
}

/**
 * Expose tagged functions in addition to the type derived facilities
 */
function asADT<
  E,
  A extends Tagged<Tag>,
  Tag extends string,
  ProgURI extends ProgramURI,
  InterpURI extends InterpreterURI
>(m: Morph<E, A, InterpURI, ProgURI>, tag: Tag, keys: KeysDefinition<A, Tag>): MorphADT<E, A, Tag, ProgURI, InterpURI> {
  return assignCallable(wrapFun(m), {
    ...m,
    ...makeADT(tag)(keys)
  })
}

function withTaggableAndMonocle<E, A, ProgURI extends ProgramURI, InterpURI extends InterpreterURI>(
  morphes: Morph<E, A, InterpURI, ProgURI> & InhabitedTypes<E, A>
): Materialized<E, A, ProgURI, InterpURI> {
  const tagged = <Tag extends TagsOf<A>>(tag: Tag) => {
    type B = A & Tagged<Tag> // here A has really type B (Tag is TagsOf<A> and cannot be never..)
    const resB = (res as Morph<E, any, InterpURI, ProgURI>) as Morph<E, B, InterpURI, ProgURI>
    return (keys: KeysDefinition<A, Tag>): MorphADT<E, A, Tag, ProgURI, InterpURI> =>
      (asADT(resB, tag, keys) as MorphADT<E, any, Tag, ProgURI, InterpURI>) as MorphADT<E, A, Tag, ProgURI, InterpURI>
  }
  const res: Materialized<E, A, ProgURI, InterpURI> = assignCallable(morphes, {
    tagged,
    ...MonocleFor<A>()
  })
  return res
}
