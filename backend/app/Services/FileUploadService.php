<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class FileUploadService
{
    public function storePublicFile(UploadedFile $file, string $directory): string
    {
        $newPath = $file->store($directory, 'public');

        if ($newPath === false) {
            throw new \RuntimeException('The file could not be stored.');
        }

        return $newPath;
    }

    public function deletePublicFile(?string $path): void
    {
        if ($path !== null) {
            Storage::disk('public')->delete($path);
        }
    }
}
