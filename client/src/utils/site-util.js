import { Program } from '../constants';

export const getSiteProgramFromAllocation = (phases) => {
  const hca = phases.some(({ allocation }) => allocation > 0);
  const mhaw = phases.some(({ mhawAllocation }) => mhawAllocation > 0);
  if (hca && mhaw) {
    return `${Program.HCA} + ${Program.MHAW}`;
  }
  return mhaw ? Program.MHAW : Program.HCA;
};
