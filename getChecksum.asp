<%@language=Javascript EnableSessionState=False%>
<script runat="server" language="JavaScript" src="framework/jshash-2.2/md5-min.js"></script>
<%
	var oFSO = Server.CreateObject("Scripting.FilesystemObject");
	var sExportFile = "export/export.txt";
	var sSource = Server.MapPath(sExportFile);
	oExportFile = oFSO.OpenTextFile(sSource, 1);
	while (!oExportFile.AtEndOfStream) {
		Response.Write(hex_md5(oExportFile.Read(10000)));
	}
	oExportFile.Close();
	Response.End();
%>