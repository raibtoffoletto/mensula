import type { GridColDef } from '@mui/x-data-grid';

export type Person = {
  id: number;
  firstName: string;
  lastName: string;
  age: number;
  department: string;
  joined: Date;
  salary: number;
  active: boolean;
};

const people = [
  ['Ada', 'Lovelace', 36],
  ['Linus', 'Torvalds', 54],
  ['Grace', 'Hopper', 85],
  ['Dennis', 'Ritchie', 70],
  ['Alan', 'Turing', 41],
  ['Margaret', 'Hamilton', 88],
  ['Ken', 'Thompson', 82],
  ['Barbara', 'Liskov', 86],
  ['Edsger', 'Dijkstra', 72],
  ['Radia', 'Perlman', 73],
] as const;

export const departments = ['Engineering', 'Research', 'Operations', 'Design'];

// Deterministic data so visual diffs stay stable. Departments come in runs of three rows,
// which gives the row-spanning story something to merge.
export const makeRows = (count: number): Person[] =>
  Array.from({ length: count }, (_, index) => {
    const [firstName, lastName, age] = people[index % people.length]!;
    return {
      id: index + 1,
      firstName,
      lastName,
      age,
      department: departments[Math.floor(index / 3) % departments.length]!,
      joined: new Date(2000 + (index % 25), index % 12, (index % 28) + 1),
      salary: 60_000 + ((index * 7_919) % 90_000),
      active: index % 3 !== 0,
    };
  });

export const currency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export const columns: GridColDef<Person>[] = [
  { field: 'id', headerName: 'ID', width: 70 },
  { field: 'firstName', headerName: 'First name', width: 130 },
  { field: 'lastName', headerName: 'Last name', width: 130 },
  {
    field: 'fullName',
    headerName: 'Full name',
    width: 170,
    sortable: false,
    valueGetter: (_value, row) => `${row.firstName} ${row.lastName}`,
  },
  { field: 'age', headerName: 'Age', type: 'number', width: 80 },
  {
    field: 'department',
    headerName: 'Department',
    type: 'singleSelect',
    valueOptions: departments,
    width: 140,
  },
  { field: 'joined', headerName: 'Joined', type: 'date', width: 120 },
  {
    field: 'salary',
    headerName: 'Salary',
    type: 'number',
    width: 120,
    valueFormatter: (value: number) => currency.format(value),
  },
  { field: 'active', headerName: 'Active', type: 'boolean', width: 90 },
];

export const rows = makeRows(25);
