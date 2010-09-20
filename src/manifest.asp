<%@language=Javascript EnableSessionState=False%>
<script runat="server" language="JavaScript" src="framework/jshash-2.2/md5-min.js"></script>
<%
	function listFolder(folder, network) {
		var folderContents = oFSO.GetFolder(folder);
		var subFolders = new Enumerator(folderContents.SubFolders);
		var subFolder;
		while (!subFolders.atEnd()) {
			subFolder = subFolders.item();
			if ((!reExclusions.test(subFolder.Name)) && reNetwork.test(subFolder.Name) === network) {
				listFolder(subFolder.Path, network);
			}
			subFolders.moveNext();
		}

		var files = new Enumerator(folderContents.Files);
		var file;
		while (!files.atEnd()) {
			file = files.item();
			if ((!reExclusions.test(file.Name)) && reNetwork.test(file.Name) === network) {
				Response.Write(cleanName(file.Path) + "\r\n");
				if (!network) {
					hash += file.DateLastModified;
				}
			}
			files.moveNext();
		}

		Response.Write ("\r\n");
	}

	function cleanName(name) {
		var reBackslash = new RegExp("\\\\", "gi")
		var tempRoot = root.replace(reBackslash, "\\\\");
		var reRoot = new RegExp(tempRoot + "\\\\", "gi");
		return name.replace(reRoot, "").replace(reBackslash, "\/");
	}

	var oFSO = Server.CreateObject("Scripting.FilesystemObject");
	var root = String(Server.MapPath("."));
	var hash = "";

	var reExclusions = /^\.|manifest|index.html|\.py|\~$/		// exclude items that start with . or end with ~
	var reNetwork = /^export$|export.txt|\.asp$/						// all items in export folder, and all ASP pages

	Response.ContentType = "text/cache-manifest";
	Response.Write("CACHE MANIFEST\r\n\r\n");
	listFolder(root, false);

	Response.Write("NETWORK:\r\n");
	listFolder(root, true);

	Response.Write("# hash: " + hex_md5(hash));
	Response.End();
%>