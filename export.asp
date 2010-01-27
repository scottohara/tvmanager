<%@language=Javascript EnableSessionState=False%>
<%
	var oDataStream = Server.CreateObject("ADODB.Stream");
	oDataStream.Open();
	oDataStream.Type = 1;
	oDataStream.Write(Request.BinaryRead(Request.TotalBytes));
	oDataStream.Position = 0;
	oDataStream.Type = 2;
	oDataStream.CharSet = "us-ascii";
	var sPostData = new String(oDataStream.ReadText());

	var oFSO = Server.CreateObject("Scripting.FilesystemObject");
	var sExportFile = "export/export.txt";

	for (var i = 8; i >= 0; i--) {
		var sSource = Server.MapPath(sExportFile + "." + i);
		var sDest = Server.MapPath(sExportFile + "." + (i + 1));

		if (oFSO.FileExists(sSource)) {
			oFSO.CopyFile(sSource, sDest, true);
		}
	}

	var sSource = Server.MapPath(sExportFile);
	var sDest = Server.MapPath(sExportFile + ".0");

	if (oFSO.FileExists(sSource)) {
		oFSO.CopyFile(sSource, sDest, true);
	}

	oExportFile = oFSO.OpenTextFile(sSource, 2, true);
	oExportFile.Write(sPostData);
	oExportFile.Close();
	Response.End();
%>