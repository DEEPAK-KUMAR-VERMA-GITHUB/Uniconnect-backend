import pcloudsdk from "pcloud-sdk-js";
import { ApiError } from "../utils/ApiError.js";

class PCloud {
  #client;
  #parentFolder = "/Uniconnect";

  constructor() {
    if (!process.env.PCLOUD_ACCESS_TOKEN) {
      return ApiError.internal("PCloud access token is not set");
    }

    this.#client = pcloudsdk.createClient(process.env.PCLOUD_ACCESS_TOKEN);
  }

  async uploadFile(file, resourceType) {
    let folderName;
    if (resourceType === "assignment") folderName = "assignments";
    else if (resourceType === "note") folderName = "notes";

    try {
      // check if the folder exists
      console.log(`Checking if folder ${folderName} exists`);
      const listFolderResult = await this.#client.listfolder(
        this.#parentFolder
      );

      if (listFolderResult.matadata && listFolderResult.metadata.contents) {
        console.log(`Folder ${folderName} exists, checking if it's a folder`);
        const existingFolder = listFolderResult.metadata.contents.find(
          (item) => item.name === folderName && item.isfolder
        );
        let folderId;

        if (existingFolder) {
          console.log(`Folder ${folderName} already exists`);
          folderId = existingFolder.folderid;
        } else {
          // create the folder if it doesn't exists
          console.log(`Folder ${folderName} does not exist, creating it`);
          const createFolderResult = await this.#client.createfolder(
            this.#parentFolder,
            folderName
          );

          if (createFolderResult.result === 0 && createFolderResult.metadata) {
            console.log(`Folder ${folderName} created successfully`);
            folderId = createFolderResult.metadata.folderid;
          } else {
            return ApiError.internal(
              `Unable to create folder ${folderName}`,
              createFolderResult.error
            );
          }
        }
      }

      if (folderId !== undefined) {
        try {
          // upload the file to the folder
          console.log(`Uploading file ${file.name} to folder ${folderName}`);
          const uploadResult = await this.#client.upload(file.buffer, folderId);

          if (uploadResult.result === 0 && uploadResult.metadata) {
            console.log(
              `File ${file.name} uploaded successfully to folder ${folderName}`
            );
            return uploadResult.metadata;
          } else {
            return ApiError.internal(
              `Unable to upload file ${file.name} to folder ${folderName}`,
              uploadResult.error
            );
          }
        } catch (error) {
          console.error(
            `Error uploading file ${file.name} to folder ${folderName}:`,
            error
          );
          return ApiError.internal(
            `Unable to upload file ${file.name} to folder ${folderName}`,
            error
          );
        }
      } else {
        console.error("Unable to find folder id for folder", folderName);
        return ApiError.internal("Unable to find folder id");
      }
    } catch (error) {
      console.error("Error interacting with pcloud:", error);
      return ApiError.internal("Unable to interact with pcloud", error);
    }
  }

  async deleteFile(fileId) {
    try {
      await this.#client.deletefile(fileId);
    } catch (error) {
      console.error("Error deleting file:", error);
      return ApiError.internal("Unable to delete file");
    }
  }

  async downloadResource(fileId) {
    try {
      const downloadLink = await this.#client.getfilelink(fileId);

      if (!downloadLink) {
        return ApiError.notFound("File not found");
      }

      return downloadLink;
    } catch (error) {
      console.error("Error downloading file:", error);
      return ApiError.internal("Unable to download file");
    }
  }
}

export default new PCloud();
