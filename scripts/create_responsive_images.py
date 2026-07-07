#!/usr/bin/env python3
import argparse
import shutil
import subprocess
from pathlib import Path

DEFAULT_SIZES = [2048, 1920, 1600, 1366, 1024, 768, 640]


def build_output_paths(source_path, sizes=None, output_root=None):
    source = Path(source_path)

    if sizes is None:
        sizes = DEFAULT_SIZES

    if output_root is None:
        output_root = source.parent
    else:
        output_root = Path(output_root)

    output_root.mkdir(parents=True, exist_ok=True)

    output_paths = []
    suffix = source.suffix.lower()
    if suffix in {".jpg", ".jpeg"}:
        suffix = ".jpg"
    elif suffix == ".png":
        suffix = ".png"
    else:
        raise ValueError(f"Unsupported image format: {source}")

    for size in sizes:
        size_dir = output_root / str(size)
        size_dir.mkdir(parents=True, exist_ok=True)
        output_file = size_dir / f"{source.stem}-{size}{suffix}"
        output_paths.append(str(output_file))

    return output_paths


def get_image_width(image_path):
    result = subprocess.check_output(
        ["identify", "-format", "%[w]", str(image_path)],
        text=True,
    )
    return int(result.strip())


def process_image(source_path, sizes=None, output_root=None):
    source = Path(source_path)
    if not source.exists():
        raise FileNotFoundError(f"Source image not found: {source}")

    output_paths = build_output_paths(source, sizes=sizes, output_root=output_root)
    width = get_image_width(source)

    suffix = source.suffix.lower()
    if suffix in {".jpg", ".jpeg"}:
        for size, output_path in zip(sizes or DEFAULT_SIZES, output_paths):
            output_path = Path(output_path)
            output_path.parent.mkdir(parents=True, exist_ok=True)
            if size > width:
                subprocess.run(
                    [
                        "convert",
                        str(source),
                        "-sampling-factor",
                        "4:2:0",
                        "-strip",
                        "-quality",
                        "85",
                        "-interlace",
                        "JPEG",
                        "-colorspace",
                        "RGB",
                        str(output_path),
                    ],
                    check=True,
                )
            else:
                subprocess.run(
                    [
                        "convert",
                        str(source),
                        "-sampling-factor",
                        "4:2:0",
                        "-strip",
                        "-resize",
                        f"{size}x",
                        "-quality",
                        "85",
                        "-interlace",
                        "JPEG",
                        "-colorspace",
                        "RGB",
                        str(output_path),
                    ],
                    check=True,
                )
    elif suffix == ".png":
        for size, output_path in zip(sizes or DEFAULT_SIZES, output_paths):
            output_path = Path(output_path)
            output_path.parent.mkdir(parents=True, exist_ok=True)
            if size > width:
                shutil.copy2(source, output_path)
            else:
                subprocess.run(
                    [
                        "convert",
                        str(source),
                        "-strip",
                        "-resize",
                        f"{size}x",
                        str(output_path),
                    ],
                    check=True,
                )
                subprocess.run(
                    ["optipng", "-quiet", "-o1", "-strip", "all", str(output_path)],
                    check=True,
                )
    else:
        raise ValueError(f"Unsupported image format: {source}")

    return output_paths


def parse_args(argv=None):
    parser = argparse.ArgumentParser(description="Generate responsive image variants")
    parser.add_argument("source_image", help="Path to the source JPEG or PNG image")
    parser.add_argument(
        "--sizes",
        nargs="+",
        type=int,
        default=DEFAULT_SIZES,
        help="Sizes to generate (for example: 2048 1024 640)",
    )
    parser.add_argument(
        "--output-root",
        help="Directory where size folders should be created. Defaults to the source file's folder.",
    )
    return parser.parse_args(argv)


def main(argv=None):
    args = parse_args(argv)
    output_paths = process_image(args.source_image, sizes=args.sizes, output_root=args.output_root)
    print("Generated responsive images:")
    for output_path in output_paths:
        print(output_path)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
