import axios from 'axios';

const getReleases = () => axios.get('/releases');
const getRelease = name => axios.get(`/releases/${encodeURIComponent(name)}`);
const getReleaseNames = () => axios.get(`/releases?names_only=1`);
const deleteRelease = ({ name, dataVersion }) =>
  axios.delete(`/releases/${name}`, { params: { data_version: dataVersion } });
const getRevisions = (name, product) => {
  const releases = [];
  const bucket = name.includes('nightly')
    ? process.env.GCS_NIGHTLY_HISTORY_BUCKET
    : process.env.GCS_RELEASES_HISTORY_BUCKET;

  function parseReleases(rawReleases) {
    if (rawReleases) {
      rawReleases.forEach(r => {
        const parts = r.name
          .replace(`${name}/`, '')
          .replace('.json', '')
          .split('-');
        const dataVersion = parseInt(parts[0], 10);
        const release = {
          name,
          product,
          data_version: Number(dataVersion) ? dataVersion : parts[0],
          timestamp: parseInt(parts[1], 10),
          changed_by: parts.slice(2).join('-'),
          data_url: r.mediaLink,
        };

        releases.push(release);
      });
    }
  }

  async function getReleases(url, pageToken) {
    const response = await axios.get(
      pageToken ? `${url}&pageToken=${pageToken}` : url
    );

    parseReleases(response.data.items);

    if (response.data.nextPageToken) {
      return getReleases(url, response.data.nextPageToken);
    }

    // descending sort, so newer versions appear first
    return releases.sort((a, b) => a.data_version < b.data_version);
  }

  return getReleases(`${bucket}?prefix=${name}/&delimeter=/`);
};

const getScheduledChangeByName = name =>
  axios.get(`/scheduled_changes/releases?name=${name}`);
const getScheduledChangeByScId = scId =>
  axios.get(`/scheduled_changes/releases/${scId}`);
const createRelease = (name, product, blob) =>
  axios.post(`/releases`, { name, product, blob });
const addScheduledChange = data => axios.post('/scheduled_changes/releases', data);

// Releases factory
// eslint-disable-next-line import/prefer-default-export
export {
  getReleases,
  getRelease,
  getReleaseNames,
  deleteRelease,
  getRevisions,
  getScheduledChangeByName,
  getScheduledChangeByScId,
  createRelease,
  addScheduledChange,
};
