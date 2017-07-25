declare module 'chai-jest-diff' {
  export default function chaiJestDiff(expand?: boolean): (chai: any, utils: any) => void;
}
