import { Expr } from '.'
import { AstBuilder, decl, run as runShader, pure } from './ast-builder'
import { TypeV2, TypeCol, Type } from './types'

export type ShaderFunc<In, Out> = (e: Expr<In>) => AstBuilder<Expr<Out>>
export type ShaderProgram = ShaderFunc<TypeV2, TypeCol>

export const overDomain = <In1 extends Type, In2 extends Type>(
  f: ShaderFunc<In1, In2>
) => (program: ShaderFunc<In2, any>): ShaderFunc<In1, any> => (p) =>
  f(p)
    .flatMap(decl)
    .flatMap((x) => program(x))

export const overRange = <Out1 extends Type, Out2 extends Type>(
  f: ShaderFunc<Out1, Out2>
) => (program: ShaderFunc<any, Out1>): ShaderFunc<any, Out2> => (p) =>
  program(p).flatMap(decl).flatMap(f)

const composeM2 = <R extends Type, S extends Type, T extends Type>(
  f: ShaderFunc<R, S>,
  g: ShaderFunc<S, T>
): ShaderFunc<R, T> => (p) => f(p).flatMap(decl).flatMap(g)

export const composeM = (...ps: ShaderFunc<any, any>[]): ShaderFunc<any, any> =>
  ps.reduce(composeM2, (x) => pure(x))

export const run = (program: ShaderProgram): Expr<TypeCol> =>
  runShader(program(Expr.Var('p')))
