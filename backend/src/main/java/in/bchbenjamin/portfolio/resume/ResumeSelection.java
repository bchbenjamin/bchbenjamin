package in.bchbenjamin.portfolio.resume;

import java.util.List;
import java.util.UUID;

public record ResumeSelection(
    List<UUID> projects,
    List<UUID> experience,
    List<UUID> education,
    List<UUID> skills,
    List<UUID> achievements,
    boolean includeAll
) {
    public ResumeSelection {
        projects = projects == null ? List.of() : List.copyOf(projects);
        experience = experience == null ? List.of() : List.copyOf(experience);
        education = education == null ? List.of() : List.copyOf(education);
        skills = skills == null ? List.of() : List.copyOf(skills);
        achievements = achievements == null ? List.of() : List.copyOf(achievements);
    }

    public static ResumeSelection all() {
        return new ResumeSelection(List.of(), List.of(), List.of(), List.of(), List.of(), true);
    }
}
