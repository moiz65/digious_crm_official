import { blurScreenshot } from "./blurScreenshot";

const nativeImageConstructor = global.Image;

describe("blurScreenshot", () => {
  afterEach(() => {
    jest.restoreAllMocks();
    global.Image = nativeImageConstructor;
  });

  test("applies a light blur before exporting the screenshot as JPEG", async () => {
    const drawImage = jest.fn();
    const toDataURL = jest.fn(() => "data:image/jpeg;base64,blurred");
    const context = { filter: "none", drawImage };
    const canvas = {
      getContext: jest.fn(() => context),
      toDataURL,
    };
    const createElement = jest.spyOn(document, "createElement").mockReturnValue(canvas);

    class MockImage {
      set src(value) {
        this._src = value;
        this.naturalWidth = 1280;
        this.naturalHeight = 720;
        this.onload();
      }
    }
    global.Image = MockImage;

    await expect(blurScreenshot("data:image/jpeg;base64,original"))
      .resolves.toBe("data:image/jpeg;base64,blurred");

    expect(createElement).toHaveBeenCalledWith("canvas");
    expect(context.filter).toBe("blur(1.5px)");
    expect(drawImage).toHaveBeenCalledWith(expect.any(MockImage), 0, 0);
    expect(toDataURL).toHaveBeenCalledWith("image/jpeg", 0.55);
  });

  test("rejects rather than uploading an unblurred screenshot when filtering is unsupported", async () => {
    const context = {
      filter: "none",
      drawImage: jest.fn(),
    };
    Object.defineProperty(context, "filter", {
      get: () => "none",
      set: jest.fn(),
    });
    jest.spyOn(document, "createElement").mockReturnValue({
      getContext: jest.fn(() => context),
    });

    class MockImage {
      set src(value) {
        this.onload();
      }
    }
    global.Image = MockImage;

    await expect(blurScreenshot("data:image/jpeg;base64,original"))
      .rejects.toThrow("Screenshot blurring is not supported");
    expect(context.drawImage).not.toHaveBeenCalled();
  });
});
