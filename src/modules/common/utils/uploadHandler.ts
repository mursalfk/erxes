type FileInfo = {
  name: string;
  size: number;
  type: string;
};

type AfterUploadParams = {
  status: 'ok' | 'error';
  response: any;
  fileInfo: FileInfo;
};

type AfterReadParams = {
  result: any;
  fileInfo: FileInfo;
};

type Params = {
  files: FileList | null;
  beforeUpload: () => void;
  afterUpload: (params: AfterUploadParams) => void;
  afterRead?: (params: AfterReadParams) => void;
  url?: string;
  responseType?: string;
  extraFormData?: Array<{ key: string; value: string }>;
};

const uploadHandler = (params: Params) => {
  const { REACT_APP_API_URL } = process.env;

  const {
    files,
    beforeUpload,
    afterUpload,
    afterRead,
    url = `${REACT_APP_API_URL}/upload-file`,
    responseType = 'text',
    extraFormData = []
  } = params;

  if (!files) {
    return;
  }

  if (files.length === 0) {
    return;
  }

  for (let i = 0; i < files.length; i++) {
    // tslint:disable-line
    const file = files[i];

    // initiate upload file reader
    const uploadReader = new FileReader();

    const fileInfo = { name: file.name, size: file.size, type: file.type };

    // after read proccess done
    uploadReader.onloadend = () => {
      // before upload
      if (beforeUpload) {
        beforeUpload();
      }

      const formData = new FormData();
      formData.append('file', file);

      for (const data of extraFormData) {
        formData.append(data.key, data.value);
      }

      fetch(url, {
        method: 'post',
        body: formData,
        headers: {
          'x-token': localStorage.getItem('erxesLoginToken') || '',
          'x-refresh-token':
            localStorage.getItem('erxesLoginRefreshToken') || ''
        }
      })
        .then(response => {
          return response[responseType]();
        })

        .then(response => {
          if (!response.ok) {
            return afterUpload({ status: 'error', response, fileInfo });
          }

          // after upload
          if (afterUpload) {
            afterUpload({ status: 'ok', response, fileInfo });
          }
        })

        .catch(e => {
          console.log(e); // tslint:disable-line
        });
    };

    // begin read
    uploadReader.readAsArrayBuffer(file);

    // read as data url for preview purposes
    const reader = new FileReader();

    reader.onloadend = () => {
      if (afterRead) {
        afterRead({ result: reader.result, fileInfo });
      }
    };

    reader.readAsDataURL(file);
  }
};

export default uploadHandler;
