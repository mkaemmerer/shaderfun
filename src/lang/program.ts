import { Expr } from '.'
import { AstBuilder, decl, run as runShader, pure } from './ast-builder'
import { TypeVec, TypeCol } from './types'

export type ShaderFunc<In, Out> = (e: Expr<In>) => AstBuilder<Expr<Out>>
export type Program = ShaderFunc<TypeVec, TypeCol>

export type Transform = <In1, Out1, In2, Out2>(
  program: ShaderFunc<In1, Out1>
) => ShaderFunc<In2, Out2>

export const overDomain = (f: ShaderFunc<any, any>): Transform => (
  program: ShaderFunc<any, any>
) => (p) => f(p).flatMap(decl).flatMap(program)

export const overRange = (f: ShaderFunc<any, any>): Transform => (
  program: ShaderFunc<any, any>
) => (p) => program(p).flatMap(decl).flatMap(f)

const composeM2 = (
  f: ShaderFunc<any, any>,
  g: ShaderFunc<any, any>
): ShaderFunc<any, any> => (p) => f(p).flatMap(decl).flatMap(g)

export const composeM = (...ps: ShaderFunc<any, any>[]): ShaderFunc<any, any> =>
  ps.reduce(composeM2, (x) => pure(x))

export const run = (program: Program): Expr<TypeCol> =>
  runShader(program(Expr.Var('p')))
