'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react'
import { GlassCard } from '../GlassCard/GlassCard'
import { Skeleton } from '../Skeleton/Skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table'

export type SortDirection = 'asc' | 'desc' | null

export type ColumnDef<T> = {
  key: string
  header: string
  accessor: (row: T) => React.ReactNode
  sortValue?: (row: T) => number | string
  width?: string
  align?: 'left' | 'right' | 'center'
}

export type DataTableProps<T> = {
  columns: ColumnDef<T>[]
  data: T[]
  loading?: boolean
  emptyMessage?: string
  skeletonRows?: number
  className?: string
}

type SortState = {
  key: string
  direction: SortDirection
}

function SortIcon({ state }: { state: SortDirection }) {
  if (state === 'asc') {
    return <ChevronUp className="ml-1 inline h-3 w-3" />
  }
  if (state === 'desc') {
    return <ChevronDown className="ml-1 inline h-3 w-3" />
  }
  return <ChevronsUpDown className="ml-1 inline h-3 w-3 opacity-40" />
}

export function DataTable<T>({
  columns,
  data,
  loading = false,
  emptyMessage = 'No data',
  skeletonRows = 5,
  className = undefined,
}: DataTableProps<T>): React.JSX.Element {
  const [sort, setSort] = useState<SortState>({ key: '', direction: null })

  function handleSort(key: string, hasSortValue: boolean): void {
    if (!hasSortValue) return
    setSort((prev) => {
      if (prev.key !== key) return { key, direction: 'asc' }
      if (prev.direction === 'asc') return { key, direction: 'desc' }
      if (prev.direction === 'desc') return { key: '', direction: null }
      return { key, direction: 'asc' }
    })
  }

  const sortedData = (() => {
    if (!sort.key || sort.direction === null) return data
    const col = columns.find((c) => c.key === sort.key)
    if (!col?.sortValue) return data
    return [...data].sort((a, b) => {
      const av = col.sortValue!(a)
      const bv = col.sortValue!(b)
      const cmp =
        typeof av === 'number' && typeof bv === 'number'
          ? av - bv
          : String(av).localeCompare(String(bv))
      return sort.direction === 'asc' ? cmp : -cmp
    })
  })()

  return (
    <GlassCard variant="subtle" {...(className !== undefined ? { className } : {})}>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => {
              const isSorted = sort.key === col.key
              const sortable = Boolean(col.sortValue)
              return (
                <TableHead
                  key={col.key}
                  style={{ width: col.width, textAlign: col.align ?? 'left' }}
                  className={
                    sortable
                      ? 'cursor-pointer select-none hover:text-[color:var(--ns-color-text)]'
                      : undefined
                  }
                  onClick={() => handleSort(col.key, sortable)}
                >
                  {col.header}
                  {sortable ? (
                    <SortIcon state={isSorted ? sort.direction : null} />
                  ) : null}
                </TableHead>
              )
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            Array.from({ length: skeletonRows }, (_, rowIdx) => (
              <TableRow key={`skeleton-${rowIdx}`}>
                {columns.map((col) => (
                  <TableCell key={col.key}>
                    <Skeleton width="100%" height={14} />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : sortedData.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="py-8 text-center text-[color:var(--ns-color-muted)]"
              >
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            sortedData.map((row, rowIdx) => (
              <TableRow key={rowIdx}>
                {columns.map((col) => (
                  <TableCell key={col.key} style={{ textAlign: col.align ?? 'left' }}>
                    {col.accessor(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </GlassCard>
  )
}
