import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Upload, Loader2, CheckCircle, XCircle, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';

export default function BulkImportAgents() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [file, setFile] = useState(null);
  const [extractedData, setExtractedData] = useState(null);
  const [importResults, setImportResults] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const uploadFile = useMutation({
    mutationFn: async (file) => {
      return await base44.integrations.Core.UploadFile({ file });
    },
    onError: (error) => {
      toast.error(`Upload failed: ${error.message}`);
    }
  });

  const extractData = useMutation({
    mutationFn: async (file_url) => {
      const schema = {
        type: "array",
        items: {
          type: "object",
          properties: {
            full_name: { type: "string" },
            employee_id: { type: "string" },
            phone_number: { type: "string" },
            id_number: { type: "string" },
            date_of_birth: { type: "string" },
            gender: { type: "string" },
            home_address: { type: "string" },
            municipality: { type: "string" },
            education_level: { type: "string" },
            employment_start_date: { type: "string" },
            notes: { type: "string" }
          },
          required: ["full_name", "employee_id"]
        }
      };
      
      return await base44.integrations.Core.ExtractDataFromUploadedFile({
        file_url,
        json_schema: schema
      });
    },
    onSuccess: (response) => {
      if (response.status === 'success') {
        setExtractedData(response.output);
        toast.success(`Extracted ${response.output.length} agents`);
      } else {
        toast.error(response.details || 'Failed to extract data');
      }
    },
    onError: (error) => {
      toast.error(`Extraction failed: ${error.message}`);
    }
  });

  const importAgents = useMutation({
    mutationFn: async (agents) => {
      const results = [];
      
      for (const agent of agents) {
        try {
          const userEmail = `${agent.employee_id}@yamimine.local`.toLowerCase();
          
          await base44.users.inviteUser(userEmail, 'user');
          
          await base44.entities.FieldAgent.create({
            ...agent,
            user_email: userEmail,
            employment_status: 'active',
            supervisor_email: user?.email,
            supervisor_name: user?.full_name || user?.email
          });
          
          results.push({ success: true, agent: agent.full_name });
        } catch (error) {
          results.push({ success: false, agent: agent.full_name, error: error.message });
        }
      }
      
      return results;
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ['field-agents'] });
      setImportResults(results);
      const successCount = results.filter(r => r.success).length;
      toast.success(`Imported ${successCount} out of ${results.length} agents`);
    },
    onError: (error) => {
      toast.error(`Import failed: ${error.message}`);
    }
  });

  const handleFileSelect = async (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    const validTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv'
    ];

    if (!validTypes.includes(selectedFile.type)) {
      toast.error('Please upload an Excel or CSV file');
      return;
    }

    setFile(selectedFile);
    setExtractedData(null);
    setImportResults(null);

    const uploadResponse = await uploadFile.mutateAsync(selectedFile);
    await extractData.mutateAsync(uploadResponse.file_url);
  };

  const handleImport = () => {
    if (!extractedData || extractedData.length === 0) {
      toast.error('No data to import');
      return;
    }
    importAgents.mutate(extractedData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <Link to={createPageUrl('HRDashboard')}>
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Bulk Import Agents</h1>
            <p className="text-slate-400 text-sm">Upload Excel or CSV file with employee data</p>
          </div>
        </div>

        {/* Upload Section */}
        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50 mb-6">
          <CardHeader className="border-b border-slate-700/50">
            <CardTitle className="text-white">Upload Employee Data</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center">
                <FileSpreadsheet className="w-16 h-16 text-slate-500 mx-auto mb-4" />
                <p className="text-white mb-2">Upload Excel or CSV file</p>
                <p className="text-slate-400 text-sm mb-4">
                  Required columns: full_name, employee_id
                </p>
                <Input
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileSelect}
                  disabled={uploadFile.isPending || extractData.isPending}
                  className="bg-slate-800 border-slate-700 text-white max-w-md mx-auto"
                />
                {file && (
                  <p className="text-cyan-400 text-sm mt-2">{file.name}</p>
                )}
              </div>

              {(uploadFile.isPending || extractData.isPending) && (
                <div className="flex items-center justify-center gap-2 text-cyan-400">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Processing file...</span>
                </div>
              )}

              <div className="bg-slate-800/50 rounded-lg p-4 text-sm text-slate-300">
                <p className="font-semibold mb-2">Supported columns:</p>
                <ul className="list-disc list-inside space-y-1 text-slate-400">
                  <li>full_name (required)</li>
                  <li>employee_id (required)</li>
                  <li>phone_number</li>
                  <li>id_number</li>
                  <li>date_of_birth</li>
                  <li>gender (male/female/other)</li>
                  <li>home_address</li>
                  <li>municipality (KwaDukuza/Mandeni/Ndwedwe/Maphumulo)</li>
                  <li>education_level (matric/certificate/diploma/degree/postgraduate)</li>
                  <li>employment_start_date</li>
                  <li>notes</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Preview Section */}
        {extractedData && extractedData.length > 0 && !importResults && (
          <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50 mb-6">
            <CardHeader className="border-b border-slate-700/50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Preview ({extractedData.length} agents)</CardTitle>
                <Button
                  onClick={handleImport}
                  disabled={importAgents.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  {importAgents.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Import All
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left text-slate-400 py-2 px-3">Name</th>
                      <th className="text-left text-slate-400 py-2 px-3">Employee ID</th>
                      <th className="text-left text-slate-400 py-2 px-3">Municipality</th>
                      <th className="text-left text-slate-400 py-2 px-3">Education</th>
                    </tr>
                  </thead>
                  <tbody>
                    {extractedData.map((agent, idx) => (
                      <tr key={idx} className="border-b border-slate-800">
                        <td className="text-white py-2 px-3">{agent.full_name}</td>
                        <td className="text-slate-300 py-2 px-3">{agent.employee_id}</td>
                        <td className="text-slate-300 py-2 px-3">{agent.municipality || 'KwaDukuza'}</td>
                        <td className="text-slate-300 py-2 px-3">{agent.education_level || 'matric'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Results Section */}
        {importResults && (
          <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700/50">
            <CardHeader className="border-b border-slate-700/50">
              <CardTitle className="text-white">Import Results</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-2">
                {importResults.map((result, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-3 p-3 rounded-lg ${
                      result.success
                        ? 'bg-emerald-900/20 border border-emerald-700/30'
                        : 'bg-red-900/20 border border-red-700/30'
                    }`}
                  >
                    {result.success ? (
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-400" />
                    )}
                    <div className="flex-1">
                      <p className="text-white font-medium">{result.agent}</p>
                      {result.error && (
                        <p className="text-red-400 text-sm">{result.error}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 flex justify-end">
                <Button
                  onClick={() => navigate(createPageUrl('HRDashboard'))}
                  className="bg-cyan-600 hover:bg-cyan-700"
                >
                  Done
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}