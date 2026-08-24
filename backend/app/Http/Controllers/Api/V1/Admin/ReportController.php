<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Report\ReportRequest;
use App\Services\OperationalReportService;
use App\Support\ApiResponse;
use Illuminate\Http\JsonResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    public function __construct(private readonly OperationalReportService $reports) {}

    public function borrowings(ReportRequest $request): JsonResponse
    {
        return ApiResponse::success($this->reports->report($request->validated()));
    }

    public function export(ReportRequest $request): StreamedResponse
    {
        $rows = $this->reports->exportRows($request->validated());

        return response()->streamDownload(function () use ($rows): void {
            $output = fopen('php://output', 'wb');
            fputcsv($output, [
                'Loan ID', 'Member ID', 'Member', 'Email', 'Book', 'Accession Number',
                'Borrowed At', 'Due At', 'Returned At', 'Status', 'Return Condition',
            ]);
            foreach ($rows as $loan) {
                fputcsv($output, $this->safeCsvRow([
                    sprintf('LOAN-%06d', $loan->id),
                    $loan->user->member_id,
                    $loan->user->name,
                    $loan->user->email,
                    $loan->bookCopy->book->title,
                    $loan->bookCopy->accession_number,
                    $loan->borrowed_at?->toISOString(),
                    $loan->due_at?->toISOString(),
                    $loan->returned_at?->toISOString(),
                    $loan->status->value,
                    $loan->return_condition,
                ]));
            }
            fclose($output);
        }, 'library-borrowing-report.csv', ['Content-Type' => 'text/csv; charset=UTF-8']);
    }

    /**
     * Prefix values that spreadsheet applications could interpret as formulas.
     * This keeps exported member/catalog data as data when the CSV is opened.
     *
     * @param  array<int, mixed>  $values
     * @return array<int, string>
     */
    private function safeCsvRow(array $values): array
    {
        return array_map(function (mixed $value): string {
            $string = $value === null ? '' : (string) $value;

            return preg_match('/^[=+\-@]/', $string) === 1 ? "'{$string}" : $string;
        }, $values);
    }
}
