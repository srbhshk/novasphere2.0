export type ClassPrimitive = string | number | null | undefined
export type ClassValue = ClassPrimitive | ClassValue[]

export function cn(...inputs: ClassValue[]): string {
  const classes: string[] = []

  const flatten = (value: ClassValue): void => {
    if (!value && value !== 0) {
      return
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        flatten(item)
      }
      return
    }
    classes.push(String(value))
  }

  for (const input of inputs) {
    flatten(input)
  }

  return classes.join(' ')
}
