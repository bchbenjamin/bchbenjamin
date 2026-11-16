package in.bchbenjamin.portfolio.resume;

import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;
import java.io.ByteArrayOutputStream;
import java.util.List;
import java.util.Map;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.util.HtmlUtils;

@Service
public class ResumePdfService {
    private final JdbcTemplate jdbc;

    public ResumePdfService(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    public byte[] render(String variant) {
        Map<String, Object> profile = jdbc.queryForMap("SELECT full_name, headline, summary, email, website_url, github_url, location FROM profile WHERE published = TRUE ORDER BY updated_at DESC LIMIT 1");
        List<Map<String, Object>> projects = jdbc.queryForList("""
            SELECT name, tagline, summary, description, short_description, resume_description,
                   repository_url, live_url
            FROM projects WHERE published = TRUE ORDER BY featured DESC, sort_order, name
            """);
        List<Map<String, Object>> experience = jdbc.queryForList("""
            SELECT role_title, organization, employment_type, description, started_on, ended_on, is_current
            FROM experience WHERE published = TRUE ORDER BY sort_order, started_on DESC
            """);
        List<Map<String, Object>> education = jdbc.queryForList("""
            SELECT institution, qualification, field_of_study, location, description, started_on, ended_on, grade
            FROM education WHERE published = TRUE ORDER BY sort_order, started_on DESC
            """);
        List<Map<String, Object>> skills = jdbc.queryForList("""
            SELECT g.name AS group_name, s.name AS skill_name
            FROM skill_groups g LEFT JOIN skills s ON s.group_id = g.id
            WHERE g.published = TRUE ORDER BY g.sort_order, s.sort_order, s.name
            """);
        List<Map<String, Object>> achievements = jdbc.queryForList("""
            SELECT category, title, detail, issuer, awarded_on
            FROM achievements WHERE published = TRUE ORDER BY sort_order, awarded_on DESC
            """);
        String html = buildHtml(profile, projects, experience, education, skills, achievements, variant);
        try (ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            PdfRendererBuilder builder = new PdfRendererBuilder();
            builder.useFastMode();
            builder.useFont(() -> getClass().getResourceAsStream("/fonts/DejaVuSans.ttf"), "DejaVu Sans");
            builder.withHtmlContent(html, "https://bchbenjamin.in/");
            builder.toStream(output);
            builder.run();
            return output.toByteArray();
        } catch (Exception exception) {
            throw new IllegalStateException("Could not render the resume PDF", exception);
        }
    }

    private static String buildHtml(Map<String, Object> profile, List<Map<String, Object>> projects,
                                    List<Map<String, Object>> experience, List<Map<String, Object>> education,
                                    List<Map<String, Object>> skills, List<Map<String, Object>> achievements,
                                    String variant) {
        boolean concise = "short".equals(variant);
        StringBuilder html = new StringBuilder("""
            <!DOCTYPE html><html lang="en"><head><meta charset="utf-8"/><title>Resume</title>
            <style>
            @page { size: A4; margin: 15mm 16mm; }
            body { font-family: 'DejaVu Sans', sans-serif; font-size: 9pt; line-height: 1.45; color: #17191d; }
            h1 { font-size: 22pt; margin: 0 0 2pt; letter-spacing: -0.5pt; }
            .headline { font-size: 10pt; color: #424b5a; margin-bottom: 5pt; }
            .contact { font-size: 8pt; color: #47505d; border-bottom: 1px solid #aeb5c0; padding-bottom: 9pt; }
            h2 { font-size: 10pt; letter-spacing: 1pt; text-transform: uppercase; color: #304d78; border-bottom: 1px solid #cbd1da; padding-bottom: 3pt; margin: 13pt 0 6pt; }
            h3 { font-size: 9pt; margin: 6pt 0 1pt; }
            p { margin: 2pt 0 5pt; }
            ul { margin: 3pt 0 6pt; padding-left: 14pt; }
            li { margin-bottom: 3pt; }
            a { color: #234f8d; text-decoration: underline; }
            .meta { color: #596271; font-size: 8pt; }
            .item { margin-bottom: 6pt; }
            .skills { margin: 0; }
            </style></head><body>
            """);
        html.append("<h1>").append(escape(profile.get("full_name"))).append("</h1>")
            .append("<div class='headline'>").append(escape(profile.get("headline"))).append("</div>")
            .append("<div class='contact'>").append(escape(profile.get("email"))).append(" · ")
            .append(escape(profile.get("location"))).append(" · ")
            .append(link(profile.get("website_url"))).append(" · ")
            .append(link(profile.get("github_url"))).append("</div>");
        html.append("<h2>Profile</h2><p>").append(escape(profile.get("summary"))).append("</p>");

        if (!skills.isEmpty()) {
            html.append("<h2>Technical skills</h2><p class='skills'>");
            String previousGroup = "";
            for (Map<String, Object> skill : skills) {
                String group = String.valueOf(skill.get("group_name"));
                String skillName = skill.get("skill_name") == null ? "" : String.valueOf(skill.get("skill_name"));
                if (!group.equals(previousGroup)) {
                    if (!previousGroup.isEmpty()) html.append("<br/>");
                    html.append("<strong>").append(escape(group)).append(": </strong>");
                    previousGroup = group;
                } else if (!skillName.isBlank()) html.append(" · ");
                html.append(escape(skillName));
            }
            html.append("</p>");
        }
        if (!experience.isEmpty()) {
            html.append("<h2>Experience</h2>");
            for (Map<String, Object> item : experience) {
                html.append("<div class='item'><h3>").append(escape(item.get("role_title"))).append(" — ")
                    .append(escape(item.get("organization"))).append("</h3><p class='meta'>")
                    .append(escape(item.get("employment_type"))).append(" · ")
                    .append(escape(item.get("started_on"))).append(" – ")
                    .append(Boolean.TRUE.equals(item.get("is_current")) ? "Present" : escape(item.get("ended_on")))
                    .append("</p><p>").append(escape(item.get("description"))).append("</p></div>");
            }
        }
        if (!education.isEmpty()) {
            html.append("<h2>Education</h2>");
            for (Map<String, Object> item : education) {
                html.append("<div class='item'><h3>").append(escape(item.get("qualification"))).append(" — ")
                    .append(escape(item.get("institution"))).append("</h3><p class='meta'>")
                    .append(escape(item.get("field_of_study"))).append(" · ")
                    .append(escape(item.get("started_on"))).append(" – ").append(escape(item.get("ended_on")))
                    .append(" · ").append(escape(item.get("grade"))).append("</p><p>")
                    .append(escape(item.get("description"))).append("</p></div>");
            }
        }
        html.append("<h2>Selected projects</h2>");
        int limit = concise ? Math.min(3, projects.size()) : projects.size();
        for (int i = 0; i < limit; i++) {
            Map<String, Object> project = projects.get(i);
            Object description = "long".equals(variant) ? project.get("description")
                : concise ? project.get("short_description") : project.get("resume_description");
            html.append("<div class='item'><h3>").append(escape(project.get("name"))).append("</h3><p class='meta'>")
                .append(escape(project.get("tagline"))).append("</p><p>").append(escape(description)).append("</p>");
            if (project.get("repository_url") != null) html.append("<p>").append(link(project.get("repository_url"))).append("</p>");
            html.append("</div>");
        }
        if (!achievements.isEmpty() && !concise) {
            html.append("<h2>Selected achievements</h2><ul>");
            for (Map<String, Object> item : achievements) {
                html.append("<li><strong>").append(escape(item.get("title"))).append("</strong> — ")
                    .append(escape(item.get("detail"))).append("</li>");
            }
            html.append("</ul>");
        }
        return html.append("</body></html>").toString();
    }

    private static String link(Object value) {
        if (value == null || value.toString().isBlank()) return "";
        String url = value.toString();
        return "<a href='" + escape(url) + "'>" + escape(url.replaceFirst("^https?://", "")) + "</a>";
    }

    private static String escape(Object value) {
        return value == null ? "" : HtmlUtils.htmlEscape(value.toString());
    }
}
