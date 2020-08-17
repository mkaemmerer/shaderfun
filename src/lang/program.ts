import { Expr } from '.'
import { AstBuilder, decl, run as runShader, pure } from './ast-builder'
import { TypeVec, TypeCol } from './types'

export type ShaderFunc<In, Out> = (e: Expr<In>) => AstBuilder<Expr<Out>>
export type ShaderProgram = ShaderFunc<TypeVec, TypeCol>

type Transform<In1, In2, Out2> = (
  program: ShaderFunc<In1, In2>
) => ShaderFunc<In2, Out2>

export const overDomain = <Out>(
  f: ShaderFunc<TypeVec, TypeVec>
): Transform<TypeVec, TypeVec, Out> => (program: ShaderFunc<TypeVec, Out>) => (
  p
) => f(p).flatMap(decl).flatMap(program)

export const overRange = <In, Out1, Out2>(
  f: ShaderFunc<Out1, Out2>
): Transform<In, Out1, Out2> => (program: ShaderFunc<In, Out1>) => (p) =>
  program(p).flatMap(decl).flatMap(f)

const composeM2 = (
  f: ShaderFunc<any, any>,
  g: ShaderFunc<any, any>
): ShaderFunc<any, any> => (p) => f(p).flatMap(decl).flatMap(g)

export const composeM = (...ps: ShaderFunc<any, any>[]): ShaderFunc<any, any> =>
  ps.reduce(composeM2, (x) => pure(x))

export const run = (program: ShaderProgram): Expr<TypeCol> =>
  runShader(program(Expr.Var('p')))
