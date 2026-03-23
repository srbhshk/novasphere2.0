'use client'

import type React from 'react'
import type { ComponentPropsWithoutRef, ForwardedRef } from 'react'
import { forwardRef } from 'react'

export type InputProps = ComponentPropsWithoutRef<'input'> & {
  id: string
}

export const Input = forwardRef(function Input(
  { className, id, ...rest }: InputProps,
  ref: ForwardedRef<HTMLInputElement>,
) {
  return <input ref={ref} id={id} className={className} {...rest} />
})

export type LabelProps = ComponentPropsWithoutRef<'label'> & {
  htmlFor: string
}

export function Label({
  className,
  htmlFor,
  children,
  ...rest
}: LabelProps): React.JSX.Element {
  return (
    <label htmlFor={htmlFor} className={className} {...rest}>
      {children}
    </label>
  )
}

export type ButtonProps = ComponentPropsWithoutRef<'button'>

export function Button({
  className,
  type = 'button',
  children,
  ...rest
}: ButtonProps): React.JSX.Element {
  return (
    <button type={type} className={className} {...rest}>
      {children}
    </button>
  )
}
