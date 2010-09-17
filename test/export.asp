<%@language=Javascript EnableSessionState=False%>
<%
	Response.Write(Request.BinaryRead(Request.TotalBytes));
	Response.End();
%>