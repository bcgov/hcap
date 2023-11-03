import _ from 'lodash';

export const sampleWeighted = <T>(samples: T[], weights: number[]): T => {
  const weightedSamples = [...samples];
  weights.forEach((weight, index) => {
    if (index < samples.length) {
      if (!weight) {
        weightedSamples.splice(index, 1);
      } else if (weight !== 1) {
        [...Array(Math.floor(weight))].forEach(() => weightedSamples.push(samples[index]));
      }
    }
  });
  return _.sample(weightedSamples);
};
